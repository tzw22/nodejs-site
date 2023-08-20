const { createVLESSServer } = require('./index.js');

// 定义端口和 UUID
const port = 3001;
const uuid = '56547ae7-a5c3-430d-a643-ba756e05115d';

// 调用函数启动 VLESS 服务器
createVLESSServer(port, uuid);
