const express = require("express");
const app = express();
const fs = require("fs");
const { writeFile } = require('fs');
const imageThumbnail = require('image-thumbnail');
require('dotenv').config();

let filesData = [];

app.get('/favicon.ico', (req, res) => { });

app.get("/:path(*)", async function (req, res) {
  try {
    const storeKey = req.headers["store-key"] || "key1";
    const folderKey = {
      key1: "Wallpaper-Anime",
    };
    const folder = folderKey[storeKey];

    if (!folder) {
      return res.status(400).send({ message: "Key not valid!" });
    }

    const path = req.params.path;
    let fullPath = null
    if (path == '') {
      fullPath = `./public/${folder}/${path}`;
    } else {
      fullPath = path
    }

    console.log('fullPath  ' + fullPath);
    const stats = fs.statSync(fullPath);

    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        // Trả về mã lỗi 404 nếu tập tin không tồn tại
        return res.status(404).send("File not found");
      }
    });
    if (stats.isDirectory()) {
      filesData = fs.readdirSync(fullPath); // Gán dữ liệu từ router GET vào biến toàn cục filesData

      // Gửi danh sách các tệp trong thư mục về client
      res.send(filesData);

    } else {
      // Nếu đường dẫn là một tệp, đọc và gửi tệp về client
      const data = fs.readFileSync(fullPath);

      let contentType = "application/octet-stream"; // Mặc định là loại dữ liệu không biết trước

      // Xác định loại nội dung dựa trên phần mở rộng của tệp
      if (isVideo(fullPath)) {
        contentType = "video/mp4";
      } else {
        contentType = "image/jpeg";
      }

      res.contentType(contentType);

      // Gửi dữ liệu của tệp về client
      res.send(data);
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(400).send({ message: "Error while getting files!" });
  }
});




const isVideo = (filename) => {
  const videoExtensionsRegex = /\.(mp4|mov|avi|mkv)$/i;
  return videoExtensionsRegex.test(filename);
};

app.post("/generate-file-json", async function (req, res) {
  try {
    let jsonData = [];
    let tags = [];
    let tagstrue = [];
    const backendDomain = process.env.BACKEND_DOMAIN;
    res.send(filesData); // Gửi dữ liệu từ router GET về client
    if (filesData == null) {
      return 'Không có dữ liệu';
    }

    for (file of filesData) {
      const parts = file.split("-");
      const valuesExceptFirst = parts.slice(1);
      const filteredItems = valuesExceptFirst.filter(item => !item.match(/\.(jpg|jpeg|png|gif)$/));
      let firstElement = parts[0];
      tagstrue.push(firstElement);
      tags.push(filteredItems);
    }

    const mergedArray = [].concat(...tags);
    const filteredArr = mergedArray.filter(item => isNaN(parseInt(item)) || isNaN(item));
    const tagsD = filteredArr.filter((item, index) => filteredArr.indexOf(item) === index);
    const tagsFalse = tagsD.map(tag => [tag, false]);
    const tagtrued = tagstrue.filter((item, index) => tagstrue.indexOf(item) === index);
    const tagtrue = tagtrued.map(tag => [tag, true]);
    
    const tagTrueSet = new Set(tagtrue.map(([tag, _]) => tag)); // 
    const tagsAll = tagtrue.concat(tagsFalse.filter(([tag, _]) => !tagTrueSet.has(tag)));

    //Tạo file thumb nếu chưa có
    const hdFiles = filesData.filter(item => item.includes("hd"));
    for (file of hdFiles) {
      if (isVideo(file) == false) {
        const fileThumb = file.replace('hd', 'thumb');
        const thumbPath = `./public/Wallpaper-Anime/${fileThumb}`
        if (!fs.existsSync(thumbPath)) {
          const thumbnail = await imageThumbnail(`./public/Wallpaper-Anime/${file}`);
          fs.writeFileSync(`./public/Wallpaper-Anime/${fileThumb}`, thumbnail);
          filesData.push(fileThumb)
        }
      }
    }

    for (tags of tagsAll) {
      let wallpaperAll = filesData.filter(fileName => fileName.includes(tags[0]));
      const wallpaperHD = wallpaperAll.filter(fileName => !fileName.includes('thumb'));

      let data = {
        name: tags[0],
        isCategory: tags[1],
        wallpapers: []
      };

      for (const element of wallpaperHD) {
        const author = '--';
        const sourceLink = 'https://4kwallpapers.com/';
        let categories = [];
        for (const tag of tagtrue) {
          if (element.includes(tag[0])) {
            categories.push(tag[0]);
          }
        }

        let filesNameThumb = null;
        let filesPathThumb = null;
        if (isVideo(element) == false) {
          filesNameThumb = element.replace('hd', 'thumb');
          const filesNameThumbEncode = encodeURIComponent(filesNameThumb)
          filesPathThumb = `${backendDomain}/public/Wallpaper-Anime/${filesNameThumbEncode}`;
        }
        const filesNameHD = element;
        const filesNameHDEncode = encodeURIComponent(filesNameHD)
        const filesPathHD = `${backendDomain}/public/Wallpaper-Anime/${filesNameHDEncode}`;


        const wallpaperData = {
          author: author,
          sourceLink: sourceLink,
          filesNameThumb: filesNameThumb,
          filesNameHD: filesNameHD,
          filesPathThumb: filesPathThumb,
          filesPathHD: filesPathHD,
          categories: categories
        };

        data.wallpapers.push(wallpaperData);
      }

      jsonData.push(data);

    }
    //Tạo json
    const jsonStr = JSON.stringify(jsonData, null, 4);
    writeFile('result.json', jsonStr, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
        throw err;
      }
      console.log('JSON file has been saved.');
    });


  } catch (error) {
    console.error("Error:", error);
    return res.status(400).send({ message: "Error while sending files!" });
  }

});
// Khởi động máy chủ
const port = 2999;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
