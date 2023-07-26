import express from 'express';
import cors from 'cors';
import { BlockfrostAdapter, NetworkId } from "@minswap/blockfrost-adapter";

const app = express();
// Set up CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: '*'
}));


const api = new BlockfrostAdapter({
    projectId: "mainnet6qOtWugv56QPxT3x0H1jYfX1feK5N3do",
    networkId: NetworkId.MAINNET,
});

app.get('/', async(req, res) => {
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
    res.json({
        prices,
        poolId
    });
});

app.listen(process.env.PORT || 3000)