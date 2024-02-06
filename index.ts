import express, { Request, Response, Express } from "express";

const app: Express = express();
const port: number = 3000;

app.use(express.json());

app.post("/github-event", (req: Request, res: Response) => {
    res.status(200).json({
        sucess: true
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})



