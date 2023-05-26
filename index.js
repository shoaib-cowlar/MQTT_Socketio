const mqtt = require("mqtt");

const shortId = require("shortid");
require("dotenv").config();
const client = mqtt.connect(process.env.MQTT_URL);
const Events = require("./eventsModel");
const { default: mongoose } = require("mongoose");
const topic = "JPLearning_SensorData";
const { Server } = require("socket.io");
const cors = require("cors");

const io = new Server({
  cors: {
    origin: "*",
  },
});

io.on("connection", (client) => {
  console.log("Client Connected");
  console.log(client.id);
});

io.listen(8080);

setInterval(() => io.emit("time", new Date().toString()), 1000);

sendData = async (topic, msg) => {
  io.emit(topic, msg);
};

mongoose.connection.on("connected", async () => {
  console.log("Mongodb Connected");
});

mongoose.connection.on("error", async () => {
  console.log("Error Connecting Mongodb");
});

client.on("connect", async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("MQTT Connected");
  client.subscribe(topic);
});

client.on("message", async (topic, message) => {
  console.log(
    "MQTT Recieved Topic",
    topic.toString(),
    " , Message : ",
    message.toString()
  );

  let data = message.toString();
  data = JSON.parse(data);
  data._id = shortId.generate();
  await saveData(data);
});

const saveData = async (data) => {
  data = new Events(data);
  data = await data.save();
  console.log("Saved Data", data);
  await sendData("JPLearning_SensorData", data);
};
