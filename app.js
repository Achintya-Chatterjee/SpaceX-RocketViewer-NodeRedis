const express = require("express");
const redis = require("redis");
const axios = require("axios");
const responseTime = require("response-time");
const { promisify } = require("util");

const app = express();
app.use(responseTime());

const client = redis.createClient({
  host: "127.0.0.1",
  port: "6379",
});

const ASYNC_GET = promisify(client.get).bind(client);
const ASYNC_SET = promisify(client.set).bind(client);
//get all the rockets
app.get("/rockets", async (req, res, next) => {
  try {
    const reply = await ASYNC_GET("rockets");
    if (reply) {
      console.log("Using Cached Data");
      res.send(JSON.parse(reply));
      return;
    }

    const response = await axios.get("https://api.spacexdata.com/v3/rockets");
    const saveResult = await ASYNC_SET(
      "rockets",
      JSON.stringify(response.data),
      "EX",
      10
    );
    console.log("New Data Cached", saveResult);
    res.send(response.data);
  } catch (error) {
    res.send(error.message);
  }
});
//get rocket by id
app.get("/rockets/:rocket_id", async (req, res, next) => {
  try {
    const { rocket_id } = req.params;
    const reply = await ASYNC_GET(rocket_id);
    if (reply) {
      console.log("Using Cached Data");
      res.send(JSON.parse(reply));
      return;
    }

    const response = await axios.get(
      `https://api.spacexdata.com/v3/rockets/${rocket_id}`
    );
    const saveResult = await ASYNC_SET(
      rocket_id,
      JSON.stringify(response.data),
      "EX",
      10
    );
    console.log("New Data Cached", saveResult);
    res.send(response.data);
  } catch (error) {
    res.send(error.message);
  }
});

app.listen(3000, () => console.log("Server is running on 3000"));
