// Self-check for the duplicate-project detector (no DB needed):
//   node scripts/similarityCheck.js
import assert from "assert";
import { embed } from "../services/similarityService.js";

const base = `Smart Irrigation System using IoT. This project builds a low-cost irrigation
controller that reads soil moisture, temperature and humidity sensors attached to an
ESP32 microcontroller and switches a water pump through a relay. Sensor data is sent
over Wi-Fi to a cloud dashboard where farmers can view readings and set thresholds.
A simple prediction model uses weather forecasts to skip watering before rain,
reducing water usage compared to timer-based systems.`;

const paraphrase = `IoT based Automatic Plant Watering System. We design an inexpensive
watering controller built on an ESP32 board that monitors soil moisture, humidity and
temperature sensors and turns a pump on and off using a relay module. Readings are
uploaded via Wi-Fi to an online dashboard so farmers can monitor fields and configure
limits. Forecast data is used to avoid irrigating when rain is expected, saving water
over fixed-schedule watering.`;

const sameDomain = `Crop Disease Detection with Deep Learning. This project trains a
convolutional neural network on leaf images to identify common plant diseases in
tomato and potato crops. A mobile app lets farmers photograph a leaf and receive a
diagnosis with treatment suggestions, working offline using a compressed model.`;

const unrelated = `Blockchain-based Student Certificate Verification. Universities
issue degree certificates as hashes stored on an Ethereum smart contract. Employers
verify a certificate by uploading the PDF, whose hash is checked against the chain,
preventing forgery without contacting the university.`;

const FLAG = Number(process.env.SIMILARITY_FLAG_THRESHOLD ?? 75);
const score = (a, b) => Math.round(a.reduce((s, x, i) => s + x * b[i], 0) * 100);

const [vBase, vPara, vSame, vUnrel] = await Promise.all(
  [base, paraphrase, sameDomain, unrelated].map(embed)
);
const scores = {
  paraphrase: score(vBase, vPara),
  sameDomain: score(vBase, vSame),
  unrelated: score(vBase, vUnrel),
};
console.log(scores);

assert(scores.paraphrase > scores.sameDomain, "paraphrase must beat same-domain");
assert(scores.sameDomain > scores.unrelated, "same-domain must beat unrelated");
assert(scores.paraphrase >= FLAG, `paraphrase must reach the flag threshold (${FLAG})`);
assert(scores.sameDomain < FLAG, `a different project must stay under the flag threshold (${FLAG})`);
console.log("ok");
