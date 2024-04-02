const express = require("express");
const app = express();
const fs = require("fs");

app.get("/:path(*)", async function (req, res) {
  try {
    const storeKey = req.headers["store-key"] || "key1";
    const folderKey = {
      key1: "ARDrawing",
    };
    const folder = folderKey[storeKey];

    if (!folder) {
      return res
        .send({
          message: "Key not valid !",
        })
        .status(400);
    }
    const path = req.params.path;
    const fullPath = `./public/${folder}/${path}`;

    // Kiểm tra xem tập tin có tồn tại không
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        // Trả về mã lỗi 404 nếu tập tin không tồn tại
        return res.status(404).send("File not found");
      }

      // Đọc nội dung của tập tin ảnh
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          // Trả về mã lỗi 500 nếu có lỗi khi đọc tập tin
          return res.status(500).send("Error reading file");
        }

        // Set header cho response là loại content là image
        res.contentType("image/jpeg");

        // Trả về dữ liệu ảnh
        res.send(data);
      });
    });
  } catch (error) {
    console.log(error);
    return res
      .send({
        message: "Error while getting images",
      })
      .status(400);
  }
});

app.post("/generate-file-json", async function (req, res) {
  const data = req.body;
  res.send(data);
});

// Khởi động máy chủ
const port = 2999;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
