"use strict";
const { get } = require("axios");

class Handler {
  constructor({ rekoSvc, translatorSvc }) {
    this.rekoSvc = rekoSvc;
    this.translatorSvc = translatorSvc;
  }
  async detecImageLabels(buffer) {
    const result = await this.rekoSvc
      .detectLabels({
        Image: {
          Bytes: buffer
        }
      })
      .promise();

    const workingItens = result.Labels.filter(
      ({ Confidence }) => Confidence > 80
    );
    const names = workingItens.map(({ Name }) => Name).join(" and ");

    return { names, workingItens };
  }
  async translateText(text) {
    const params = {
      SourceLanguageCode: "en",
      TargetLanguageCode: "pt",
      Text: text
    };
    const { TranslatedText } = await this.translatorSvc
      .translateText(params)
      .promise();

    return TranslatedText.split(" e ");
  }
  formatTextResults(texts, workingItens) {
    const finalText = [];
    for (const indexText in texts) {
      const nameInPortuguese = texts[indexText];
      const confidence = workingItens[indexText].Confidence;
      finalText.push(
        `${confidence.toFixed(2)}% de ser do tipo ${nameInPortuguese}`
      );
    }
    return finalText.join("\n");
  }

  async getImageBuffer(imageUrl) {
    const response = await get(imageUrl, {
      responseType: "arraybuffer"
    });
    const buffer = Buffer.from(response.data, "base64");
    return buffer;
  }
  async main(event) {
    try {
      console.log("Downloading image...");

      const { imageUrl } = event.queryStringParameters;

      console.log("Detecting Labels...");
      // const imgBuffer = await readFile("./image/arvore.jpeg");
      const buffer = await this.getImageBuffer(imageUrl);
      const { names, workingItens } = await this.detecImageLabels(buffer);
      console.log("Translating to portuguese...");
      const texts = await this.translateText(names);
      console.log("Handling final objects...");
      const finalText = this.formatTextResults(texts, workingItens);
      console.log("finihing...");

      return {
        statusCode: 200,
        body: `A imagem tem\n `.concat(finalText)
      };
    } catch (error) {
      console.log("Error***", error.stack);
      return {
        statusCode: 500,
        body: "Internal server error"
      };
    }
  }
}
//factory
const aws = require("aws-sdk");
const reko = new aws.Rekognition();
const translator = new aws.Translate();
const handler = new Handler({
  rekoSvc: reko,
  translatorSvc: translator
});

module.exports.main = handler.main.bind(handler);
