const express = require("express");
const app = express();
const path = require('path');
// Thiết lập thư mục public
app.use(express.static("public"));

// Khởi động máy chủ
const port = 2999;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
