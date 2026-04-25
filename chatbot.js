import http from "http";
import fs from "fs";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
 apiKey: process.env.OPENAI_API_KEY,
});

const PORT = 3000;
const HISTORICO = "historico.json";

// carregar histórico
function carregarHistorico() {
 if (fs.existsSync(HISTORICO)) {
   return JSON.parse(fs.readFileSync(HISTORICO));
 }
 return [];
}

// salvar histórico
function salvarHistorico(historico) {
 fs.writeFileSync(HISTORICO, JSON.stringify(historico, null, 2));
}

// servidor
const server = http.createServer(async (req, res) => {

 // servir HTML
 if (req.method === "GET") {
   const html = fs.readFileSync("index.html");
   res.writeHead(200, { "Content-Type": "text/html" });
   return res.end(html);
 }

 // rota API
 if (req.method === "POST" && req.url === "/chat") {
   let body = "";

   req.on("data", chunk => {
     body += chunk;
   });

   req.on("end", async () => {
     const dados = JSON.parse(body);
     const pergunta = dados.pergunta;

     let historico = carregarHistorico();

     historico.push({ role: "user", content: pergunta });

     const resposta = await client.chat.completions.create({
       model: "gpt-4o-mini",
       messages: [
         { role: "system", content: "Você é um orientador de carreira em TI para iniciantes." },
         ...historico
       ]
     });

     const texto = resposta.choices[0].message.content;

     historico.push({ role: "assistant", content: texto });

     salvarHistorico(historico);

     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify({ resposta: texto }));
   });
 }
});

server.listen(PORT, () => {
 console.log(`Servidor rodando em http://localhost:${PORT}`);
});

