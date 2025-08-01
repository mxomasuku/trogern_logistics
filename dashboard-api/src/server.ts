const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
const PORT =  process.env.PORT || 500


app.get('/ping', (req: any, res: any) => {
    res.status(200).json({message: 'pong'})
});

app.listen(PORT, () => {
    console.log(`Logisitics dashboard running on port http/localhost:${PORT}`)
})