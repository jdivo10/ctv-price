import express from 'express';
import cors from 'cors';
import { BlockfrostAdapter, NetworkId } from "@minswap/blockfrost-adapter";
import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';


const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Set up CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const api = new BlockfrostAdapter({
    projectId: "mainnetzFTkLDTPNXT37SkNra7fGS4xjWwRVldY",
    networkId: NetworkId.MAINNET,
});

app.get('/prices', async(req, res) => {
    const filePath = path.resolve(__dirname, 'lastPrice.json');

    if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath);
        const lastPriceData = JSON.parse(rawData);

        const lastPriceTime = new Date(lastPriceData.timeStamp);
        const now = new Date();

        const difference = now.getTime() - lastPriceTime.getTime();
        const differenceInMinutes = Math.floor(difference / 1000 / 60);

        if (differenceInMinutes < 1) {
            return res.json(lastPriceData);
        }
    }

    let prices;
    let poolId;
    for (let i = 1;; i++) {
        const pools = await api.getPools({
            page: i,
            poolAddress: "addr1z8snz7c4974vzdpxu65ruphl3zjdvtxw8strf2c2tmqnxz2j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq0xmsha",
        });
        if (pools.length === 0) {
            // last page
            break;
        }
        const minADAPool = pools.find(
            (p) =>
            p.assetA === "lovelace" &&
            p.assetB ===
            "9f452e23804df3040b352b478039357b506ad3b50d2ce0d7cbd5f806435456"
        );
        if (minADAPool) {
            const [a, b] = await api.getPoolPrice({ pool: minADAPool });
            prices = {
                ADA_CTV_price: a.toString(),
                CTV_ADA_price: b.toString()
            };
            poolId = minADAPool.id;
            break;
        }
    }

    const newPriceData = {
        prices,
        poolId,
        timeStamp: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(newPriceData, null, 2));
    res.json(newPriceData);
});

app.listen(process.env.PORT || 3000)