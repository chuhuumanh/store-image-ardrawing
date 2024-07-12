const express = require("express");
const {globSync} = require('glob');
const fs = require('fs/promises');
const app = express();
const path = require('path');
// Thiết lập thư mục public
app.use(express.static("public"));

app.get('/public/images/paths', async (req, res) => {
  const pattern = 'public/**/*.{png,jpg,bmp,jpeg}';
  const files = globSync(pattern);
  const host = 'http://159.223.66.60:2999/'
  var allPaths = [];
  for(const file of files){
    const parse = path.parse(file);
    const fileName = parse.base;
    const dir = path.dirname(file).split(path.sep).filter(x => x!='public');
    const noPublic = path.dirname(file).replace(/public|\\/g, '/');
    const fileDetails = {
      file: path.posix.join(host, noPublic, fileName).replace('/', '//'),
      name: parse.name.replace(/-/g, ' '),
      time: 10,
      standing: false
    }
    if(!allPaths.find(x => x.name === dir[0]))
      allPaths.push({
        name: dir[0],
        icon: '',
        list: []
      });
    allPaths.find(x => x.name === dir[0]).list.push(fileDetails);
  }
  const data = JSON.stringify(allPaths, null, 2);
  await fs.writeFile('public/paths.json', data);
  res.status(200).json(allPaths);
});

// Khởi động máy chủ
const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
