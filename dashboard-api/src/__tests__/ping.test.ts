import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

app.get('/ping', (_, res) => res.status(200).json({message: 'pong'}));

describe('Ping route', () => {
    it('responds with pong', async () => {
        const res = await request(app).get('/ping');
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('pong');
    })
})