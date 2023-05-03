const express = require('express')
const path = require('path')
const app = express();
const dotenv = require('dotenv');
const cors = require("cors");
const fileupload = require("express-fileupload");
const bodyParser = require('body-parser');

const Moralis = require("moralis").default;

const fs = require("fs"); 

dotenv.config({ path: './.env'})

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

app.use(cors());
app.use(fileupload());
app.use(express.static("files"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
app.post("/upload", (req, res) => {
    const newpath = __dirname + "/files/";
    const file = req.files.file;
    const filename = file.name;
 
    file.mv(`${newpath}${filename}`, async (err) => {
        if (err) {
            res.status(500).send({ message: "File upload failed", code: 200 });
        }

        const ipfsResponse = await runIPFS(filename, `${newpath}${filename}`);
        
        if( ipfsResponse[0].path ) {
            res.status(200).send({ message: "File Uploaded", code: 200, ipfs: ipfsResponse[0].path});
        } else {
            res.status(500).send({ message: "File upload failed", code: 200 });
        }

        fs.unlinkSync(`${newpath}${filename}`);
    });
});

const runIPFS = async (fileName, filePath) => {
    console.log(process.env.Moralis_API_KEY);
    await Moralis.start({
        apiKey: process.env.Moralis_API_KEY,
    });
    
    const abi = [
        {
        path: fileName,
        content: fs.readFileSync(filePath, {encoding: 'base64'}),
        },
    ];
    
    const response = await Moralis.EvmApi.ipfs.uploadFolder({ abi });

    return response.toJSON();

};

app.listen(process.env.PORT, () => {
    console.log(`Application is running on port ${process.env.PORT}`)
})
