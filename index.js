/**
 * Auto Save photos
 */
import http from "http";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import fs from "fs";
const app = express();
const port = 8080;

// Create a server object
const server = http.createServer((req, res) => {
  // Set the response header
  res.writeHead(200, { "Content-Type": "text/plain" });
  // Write some text to the response
  res.end("Welcome to my simple Node.js app!");
});
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Replace with your actual Telegram bot token
const token = "7328329090:AAGpNl8bgYl6arD5hOpv0j_kFBmyBNYTAMc";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Map to store photo file IDs that have been processed
let processedPhotos = new Set();

// Dictionary to store uploaded photo details by user ID
let deletedMessages = {};
// Function to check for missing photos

// Listen for any kind of message
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const msgName = msg.chat.title;
  const theDate = new Date(msg.date * 1000).toDateString();
  const messageId = msg.message_id;
  const id = msg.from.id;

  const currentDate = new Date(msg.date * 1000)
    .toLocaleDateString("en-GB", {
      day  : "numeric",
      month: "long",
      year : "numeric",
    })
    .replace(/ /g, "-");

  // Directory to save photos
  if (msg.photo) {
    try {
      const downloadDirectory = `./downloads/${msgName}/${currentDate}/`;
      // Ensure the directory exists
      fs.mkdirSync(downloadDirectory, { recursive: true });

      // Get file details
      const photo = msg.photo.slice(-1).pop(); // Get the largest available photo (last in the array)

      // Get file path and download it
      const filePath = await bot.downloadFile(photo.file_id, downloadDirectory);
      // console.log(`Downloaded photo ${filePath}`);

      // Reply to user
      //   bot.sendMessage(chatId, 'Photo saved successfully!');
    } catch (err) {
      console.log("Error downloading photo:", err);
      //   bot.sendMessage(chatId, 'Failed to save photo.');
    }
  }
});

// bot.on("edited_message", (msg) => {
//   console.log('Edited message in chat ');
// })
// Log any errors
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});
// Function to download file
TelegramBot.prototype.downloadFile = async function (fileId, downloadDir) {
  const fileDetails = await this.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${token}/${fileDetails.file_path}`;
  const fileName = fileDetails.file_path.split("/").pop();

  const response = await axios({
    method: "GET",
    url: fileUrl,
    responseType: "stream",
  });

  const filePath = `${downloadDir}${fileName}`; // download photo to this directory
  const fileStream = fs.createWriteStream(filePath);
  response.data.pipe(fileStream);

  return new Promise((resolve, reject) => {
    fileStream.on("finish", () => {
      resolve(filePath);
      processedPhotos.add(fileId); // Add file ID to processed set
    });
    fileStream.on("error", (err) => reject(err));
  });
};

console.log("Bot is running...");
