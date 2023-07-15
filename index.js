/**
 * Creates a WebSocket server that proxies TCP connections to a remote server.
 * @param {number} port - The port number to listen on for WebSocket connections.
 * @param {string} uuid - The UUID to match against the first 16 bytes of the first message received from the client.
 * @returns {void}
 */
module.exports = function (port, uuid) {
  const net = require('net');
  const { WebSocket, createWebSocketStream } = require('ws');
  const logcb = (...args) => console.log.bind(this, ...args);
  const errcb = (...args) => console.error.bind(this, ...args);
  // 使用传入的 port 和 uuid 替换默认值 env var 优先级最高
  uuid = (process.env.UUID || uuid || 'd342d11e-d424-4583-b36e-524ab1f0afa4').replaceAll('-', '');
  port = process.env.PORT || port || 7860;
  const wss = new WebSocket.Server({ port }, logcb('listen:', port));
  wss.on('connection', ws => {
    ws.once('message', msg => {
      const [VERSION] = msg;
      const id = msg.slice(1, 17);
      if (!id.every((v, i) => v == parseInt(uuid.substr(i * 2, 2), 16))) return;
      let i = msg.slice(17, 18).readUInt8() + 19;
      const port = msg.slice(i, i += 2).readUInt16BE(0);
      const ATYP = msg.slice(i, i += 1).readUInt8();
      const host = ATYP == 1 ? msg.slice(i, i += 4).join('.') ://IPV4
        (ATYP == 2 ? new TextDecoder().decode(msg.slice(i + 1, i += 1 + msg.slice(i, i + 1).readUInt8())) ://domain
          (ATYP == 3 ? msg.slice(i, i += 16).reduce((s, b, i, a) => (i % 2 ? s.concat(a.slice(i - 1, i + 1)) : s), []).map(b => b.readUInt16BE(0).toString(16)).join(':') : ''));//ipv6
      logcb('conn:', host, port);
      ws.send(new Uint8Array([VERSION, 0]));
      const duplex = createWebSocketStream(ws);
      net.connect({ host, port }, function () {
        this.write(msg.slice(i));
        duplex.on('error', errcb('E1:')).pipe(this).on('error', errcb('E2:')).pipe(duplex);
      }).on('error', errcb('Conn-Err:', { host, port }));
    }).on('error', errcb('EE:'));
  });
};