const fs = require('fs');
const https = require('https');
const path = require('path');

const url = "https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2I1YmVmNmZhY2JlYjRlN2E4NWY5OWQxZWRlYjFjNDM2EgsSBxCnoJT_hB4YAZIBIwoKcHJvamVjdF9pZBIVQhMzNjk0MTYxOTgyNDk4NjgzMTUy&filename=&opi=96797242";
const dest = path.join(__dirname, 'stitch_generated.html');
const file = fs.createWriteStream(dest);

https.get(url, function(response) {
  if (response.statusCode !== 200) {
    console.error(`Failed to get '${url}' (${response.statusCode})`);
    return;
  }
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Download completed to ' + dest);
  });
}).on('error', function(err) {
  fs.unlink(dest);
  console.error(err.message);
});
