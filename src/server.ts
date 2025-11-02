
import mongoose from "mongoose";
import app from "./app";
import { configs } from "./app/configs";
async function main() {
    await mongoose.connect(configs.db_url!);
    app.listen(configs.port, () => {
        console.log(`Server listening on port ${configs.port}`);
    });
}
main().catch(err => console.log(err));
