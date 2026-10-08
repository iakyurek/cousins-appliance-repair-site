# Cousins Appliance Repair

**Live site:** [cousinsappliancerepair.com](https://www.cousinsappliancerepair.com)

This is the website for an appliance repair business in the Milwaukee area. Customers can book a visit, look through past repair jobs, read repair tips on the blog, and chat with a support bot called CousinsCare.

Built with Node.js, Express, the OpenAI API, Python, FastAPI, pandas, HTML, CSS, and JavaScript. It's hosted on Render.

## How the chatbot works

When a customer types a message, the Node backend sends it to a small Python service first. That service runs a text classifier I trained on labeled customer questions. It sorts each message into one of 15 topics, like a dryer that won't heat, a question about pricing, or a safety emergency.

If the model is confident enough, the backend tells OpenAI what the customer is asking about. That keeps the answer on topic. If the model or the API key isn't available, the bot falls back to simple built in answers. Either way, the customer gets a reply.

## Where things are

Everything lives in the `cousins_appliance_new_site 13` folder.

| Folder | What's in it |
|---|---|
| `ml_intent` | The training script, the training data, and the FastAPI service |
| `backend` | The Express server that serves the site and handles chat |
| Top level files | The pages, styles, and scripts for the site |

## Running it

The setup steps are in the [project README](cousins_appliance_new_site%2013/README.md) inside that folder.
