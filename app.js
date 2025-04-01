// Creating a server and serve html file

import {createServer} from 'http';
import { readFile,writeFile } from 'fs/promises';
import crypto from "crypto";
import path from 'path';


const PORT = 3001;
const DATA_FILE = path.join('data', 'links.json');

const loadLinks = async () => {
    try {
        const data = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    }catch(error) {
        if(error.code === "ENOENT") {
            await writeFile(DATA_FILE, JSON.stringify({}))
            return {}
        }
        throw error;
    }
}

const saveLinks = async (links) => {
    await writeFile(DATA_FILE, JSON.stringify(links));
}

const serveFile = async (res, filePath, contentType) => {
    try {
        const data = await readFile(filePath); // ek file ko read ki
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);  // uss file ko server kr dia (iss file ko response me dikhaya)
    }catch(error) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end('404 page not found');  // yeh error bhi dikha di 
    }
}

const server = createServer(async (req, res) => {  // ek server create ki
    console.log(req.url);
    
    const links = await loadLinks();

    if (req.method === 'GET') {    // route ko hit kr rhe h
        if(req.url === '/') {   // yeh home page (index.html) ko serve kr rha h means usko nodejs me get kr rha hu
            return serveFile(res, path.join('public', 'index.html'), "text/html" )   // html file ko serve kr rhe h
        }
        else if(req.url === '/style.css') {   // yeh css file ko serve kr rha h means usko nodejs me get kr rha hu
            return serveFile(res, path.join('public', 'style.css'), "text/css" )   // css file ko serve kr rhe h
        }
        else if(req.url === "/links") {
            const links = await loadLinks();
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(links));
        }
        else {
            const links = await loadLinks();
            const shortCode = req.url.slice(1);
            console.log("links redirect: ", req.url);
            
            if(links[shortCode]) {
                res.writeHead(302, { location: links[shortCode] });
                return res.end();
            }

            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end("Shortened URL is not found!!!");
        }
    }

    if(req.method === "POST" && req.url === "/shorten") {
        let body = "";
        req.on("data", (chunk) => {      // frontend se data get kr rhe h
            body = body + chunk;
        })
        req.on('end', async () => {
            console.log(body);
            const {url, shortCode} = JSON.parse(body);

            if(!url) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                return res.end("URL is required")
            }

            // checking duplicate data(shortCode) pehle se hi links.json file me nhi h na jaha humlog store kr rhe h yeh sb (url, shortCode)
            const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

            // yaha links means pura jo mujhe mil rha h data (url and shortCode both) woh h and finalShortCode means shortCode jo humlog diye h 
            if(links[finalShortCode]) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                return res.end("short code exist. Please choose another.")
            }

            // links hamara jo bhi json ka empty object h starting me woha pr humne woh key and value add kr di
            // yaha links means pura jo mujhe mil rha h data (url and shortCode both) woh h and finalShortCode means shortCode jo humlog diye h url ka and iska value humlog ko milega woh url jo humlog denge shortCode ke liye  (time=19:10)
            links[finalShortCode] = url;      // finalShortCode = key & url = value
            await saveLinks(links);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({success:true, shortCode:finalShortCode}))
        })
    }
})

// ab server ko listen krna hoga 
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
})




// yeh html file ko serve krne ka try-catch block 
// try {
//     const data = await readFile(path.join('public', 'index.html')) // ek file ko read ki
//     res.writeHead(200, { "Content-Type": "text/html" });
//     res.end(data);  // uss file ko server kr dia (iss file ko response me dikhaya)
// }catch(error) {
//     res.writeHead(404, { "Content-Type": "text/html" });
//     res.end('404 page not found');  // yeh error bhi dikha di 
// }


// yeh css file ko serve krne ka try-catch block 
// try {
//     const data = await readFile(path.join('public', 'style.css')) // ek file ko read ki
//     res.writeHead(200, { "Content-Type": "text/css" });
//     res.end(data);  // uss file ko server kr dia (iss file ko response me dikhaya)
// }catch(error) {
//     res.writeHead(404, { "Content-Type": "text/css" });
//     res.end('404 page not found');  // yeh error bhi dikha di
// }