const uuid = require("uuid");
const Joi = require("@hapi/joi");
const decoratorValidator = require("./util/decoratorValidator");
const globalEnum = require("./util/globalEnum");
class Handler {
  constructor({ dynamoDbSvc }) {
    this.dynamoDbSvc = dynamoDbSvc;
    this.dynamodbTable = process.env.DYNAMODB_TABLE;
  }
  static validator() {
    return Joi.object({
      nome: Joi.string()
        .max(100)
        .min(2)
        .required(),
      poder: Joi.string()
        .max(20)
        .required()
    });
  }
  async insertItem(params) {
    return this.dynamoDbSvc.put(params).promise();
  }
  prepareData(data) {
    const params = {
      TableName: this.dynamodbTable,
      Item: {
        ...data,
        id: uuid.v1(),
        createdAt: new Date().toISOString()
      }
    };

    return params;
  }
  handlerSuccess(data) {
    const response = {
      statusCode: 200,
      body: JSON.stringify(data)
    };
    return response;
  }

  handlerError(data) {
    const response = {
      statusCode: data.statusCode || 501,
      headers: { "Content-Type": "text/plain" },
      body: "Couldn't create item!!"
    };
    return response;
  }
  async main(event) {
    try {
      //agora o decorator ja modifica o body enviando no formato JSON
      const data = event.body;

      const dbParams = this.prepareData(data);

      await this.insertItem(dbParams);

      return this.handlerSuccess(dbParams.Item);
    } catch (error) {
      console.log("Deu merda**", error.stack);
      return this.handlerError({ statusCode: 500 });
    }
  }
}

//factory
const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const handler = new Handler({
  dynamoDbSvc: dynamoDb
});
module.exports = decoratorValidator(
  handler.main.bind(handler),
  Handler.validator(),
  globalEnum.ARG_TYPE.BODY
);
