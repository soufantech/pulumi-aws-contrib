"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// dist/components/notifications/entities/notification-lambda-handler.js
var require_notification_lambda_handler = __commonJS({
  "dist/components/notifications/entities/notification-lambda-handler.js"(exports2) {
    "use strict";
    var __awaiter2 = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NotificationLambdaHandler = void 0;
    var client_kms_1 = require("@aws-sdk/client-kms");
    var NotificationLambdaHandler = class {
      constructor() {
        this.handle = this.handle.bind(this);
      }
      // eslint-disable-next-line
      kmsDecrypt(content, key) {
        return __awaiter2(this, void 0, void 0, function* () {
          const region = process.env.KMS_REGION || "";
          const kmsClient = new client_kms_1.KMS({ region });
          const kmsReq = {
            CiphertextBlob: Buffer.from(content, "base64"),
            KeyId: key
          };
          const kmsData = yield kmsClient.decrypt(kmsReq);
          const plainText = kmsData.Plaintext || new Uint8Array([]);
          return Buffer.from(plainText).toString();
        });
      }
      handle(event) {
        return __awaiter2(this, void 0, void 0, function* () {
          console.info("[INFO]:Received event:", JSON.stringify(event));
          try {
            const notifications = yield Promise.all(event.Records.map((evRecord) => this.processEvent(JSON.parse(evRecord.Sns.Message))));
            console.debug(`[DEBUG]:Sending ${notifications.length} msgs`);
            yield Promise.all(notifications.map((message) => this.sendNotification(message)));
            console.info("[INFO]:Done!");
          } catch (error) {
            if (error instanceof Error) {
              console.error(`[ERROR]:${error.message}`);
            }
            throw error;
          }
        });
      }
    };
    exports2.NotificationLambdaHandler = NotificationLambdaHandler;
  }
});

// dist/components/notifications/teams/entities/teams-notification-handler.js
var require_teams_notification_handler = __commonJS({
  "dist/components/notifications/teams/entities/teams-notification-handler.js"(exports2) {
    "use strict";
    var __awaiter2 = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TeamsNotificationHandler = void 0;
    var notification_lambda_handler_1 = require_notification_lambda_handler();
    var TeamsNotificationHandler = class extends notification_lambda_handler_1.NotificationLambdaHandler {
      constructor(encryptedWebhook) {
        super();
        this.encryptedWebhook = encryptedWebhook;
      }
      sendNotification(messageBody) {
        return __awaiter2(this, void 0, void 0, function* () {
          console.debug("[DEBUG]:Sending message to Teams...");
          const card = {
            type: "message",
            attachments: [
              {
                contentType: "application/vnd.microsoft.card.adaptive",
                contentUrl: null,
                content: {
                  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                  type: "AdaptiveCard",
                  version: "1.0",
                  body: messageBody
                }
              }
            ]
          };
          const response = yield fetch(yield this.kmsDecrypt(this.encryptedWebhook, ""), {
            method: "POST",
            body: JSON.stringify(card),
            headers: {
              "content-type": "application/vnd.microsoft.teams.card.o365connector"
            }
          });
          const responseBody = yield response.text();
          if (!response.ok || responseBody.includes("Microsoft Teams endpoint returned HTTP error")) {
            const { status, statusText } = response;
            throw new Error(`TEAMS_ERROR: ${status} - ${statusText} - ${responseBody}`);
          }
        });
      }
    };
    exports2.TeamsNotificationHandler = TeamsNotificationHandler;
  }
});

// dist/components/notifications/teams/entities/ecs-deploy-teams-notification-handler.js
var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = void 0;
var teams_notification_handler_1 = require_teams_notification_handler();
var EcsDeployTeamsNotificationHandler = class extends teams_notification_handler_1.TeamsNotificationHandler {
  constructor() {
    super(...arguments);
    this.deployColors = {
      SERVICE_DEPLOYMENT_IN_PROGRESS: "#FF8C00",
      SERVICE_DEPLOYMENT_COMPLETED: "good",
      SERVICE_DEPLOYMENT_FAILED: "attention"
    };
  }
  processEvent(eventObject) {
    return __awaiter(this, void 0, void 0, function* () {
      const resource = eventObject.resources[0];
      const title = eventObject["detail-type"];
      const description = resource;
      const color = this.deployColors[eventObject.detail.eventName];
      const status = eventObject.detail.eventName.split("_").slice(2).join("_");
      const timestamp = eventObject.time.replace(/([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}).*/, "$1 $2 +0000");
      const accountId = eventObject.account;
      const regionName = eventObject.region;
      const region = resource.split(":")[3];
      const { reason } = eventObject.detail;
      const referUri = `https://${region}.console.aws.amazon.com/ecs/v2/clusters/${resource.split("/")[1]}/services/${resource.split("/")[2]}/deployments?region=${region}`;
      return [
        {
          type: "TextBlock",
          size: "Medium",
          weight: "Bolder",
          text: title
        },
        {
          type: "TextBlock",
          spacing: "None",
          text: description,
          isSubtle: true
        },
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: `**Status:** 

 ${status}`,
                  color
                }
              ],
              width: "stretch"
            },
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: `**Account:** 

 ${accountId}`
                }
              ],
              width: "stretch"
            }
          ]
        },
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: `**When:**

${timestamp}`
                }
              ],
              width: "stretch"
            },
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: `**Region:**

${regionName}`
                }
              ],
              width: "stretch"
            }
          ]
        },
        {
          type: "TextBlock",
          text: `**Reason:** 

 ${reason}`,
          wrap: true
        },
        {
          type: "TextBlock",
          text: `[View deployment in ECS](${referUri})`,
          wrap: true
        },
        {
          type: "TextBlock",
          text: `---`,
          wrap: true
        }
      ];
    });
  }
};
var lambda = new EcsDeployTeamsNotificationHandler(process.env.TEAMS_WEBHOOK || "");
exports.handle = lambda.handle;
