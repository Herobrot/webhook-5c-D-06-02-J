import express, { Request, Response, Express, NextFunction } from "express";
import * as crypto from "crypto"

const app: Express = express();
const port: number = 3000;

app.use(express.json());

//github (client)
const verify_signature = (req: Request) => {
    try{
        const signature = crypto.createHmac("sha256", "yameolvide")
          .update(JSON.stringify(req.body))
          .digest("hex");

        const trusted = Buffer.from(`sha256=${signature}`, 'ascii');
        const untrusted =  Buffer.from(req.header("x-hub-signature-256") || '', 'ascii');
        return crypto.timingSafeEqual(trusted, untrusted);
    } catch (err){
      return false
    }
}

const verifySignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if(!verify_signature(req)){
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    })
  }

  next();
}

app.post("/github-event", verifySignatureMiddleware, (req: Request, res: Response) => {
    const { body } = req;
    const { action, sender, repository } = body
    const event = req.header('x-github-event');
    let message: string = "";

    let signature = req.header('x-hub-signature');
    console.log("firma", signature)

    switch(event){
        case "star":
          message = `${sender.login} ${action} on ${repository.full_name}`
          break;
        case "issue":
          const { issue } = body
          message = `${sender.login} ${action} issue ${issue.title} on ${repository.full_name}`
          break;
        case "push":
          const { ref } = body
          message = `${sender.login} pushed to ${ref} on ${repository.full_name}`
          enviarDiscord(message, "https://discord.com/api/webhooks/1206622419876450334/7CF7Ajxum2YPTZ47zjbJnVNVuyWMrH_lchGTimuFGviz7C0LWIHZVrY9XEKF_GXLja-7");
          break;
        default:
          message = `Event ${event} not handled`
          break;
}
console.log(message);

  res.status(200).json({succes: true});

});

//discord (server)
function enviarDiscord(payload: string, discordUrl: string){
  const data = typeof payload === 'string' ? { content: payload } : payload;

  return new Promise((resolve, reject) => {
    fetch(discordUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({content: payload}),
    })
      .then((response) => {
        if (!response.ok) {
          reject(new Error(`Could not send message: ${response.status}`));
        }
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})



