import { interval, Subscription } from 'rxjs';
import { DeviceId, Query, Result } from './models';
import { sendApiRequest } from '../request';
const atob = require('atob');

const payload = {
    notification: {
        title: 'Notification Title',
        body: 'This is an example notification',
    }
};

const options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24, // 1 day
};

export class Api {
    private queryInterval = 3000;
    private subscription: Subscription;

    constructor(private server, private firebase) {
        this.init();
    }

    private init() {
        this.server.post('/firebase/deviceID', async (req, res) => {
            const deviceId = req.body.deviceId;
            const results = await DeviceId.find().exec();
            console.log('DEVICE RESULTS: ', results);
            if (!results.find((result) => result.deviceId === deviceId)) {
                const obj = new DeviceId({ deviceId });
                await obj.save();
            }
            res.status(200).send('device registered');
        });

        this.server.post('/example', async (req, res) => {
            const results = await DeviceId.find().exec();
            for (const result of results) {
                this.firebase.messaging().sendToDevice(result.deviceId, payload, options);
            }
            res.status(200).send('Example notifications sent');
        });

        this.server.post('/interval', async (req, res) => {
            this.queryInterval = req.body.interval;
            if (this.subscription && !this.subscription.closed) {
                await this.start();
            }
            res.status(200).send();
        });

        this.server.post('/start', async (req, res) => {
            await this.start();
            res.status(200).send('query search started');
        });

        this.server.post('/stop', (req, res) => {
            if (this.subscription) {
                this.subscription.unsubscribe();
            }
            res.status(200).send('query search stopped');
        });

        this.server.get('/status', (req, res) => {
            if (this.subscription && !this.subscription.closed) {
                res.status(200).send('running');
            } else {
                res.status(200).send('not running');
            }
        });

        this.server.post('/queries', async (req, res) => {
            const product = req.body.product;
            const minPrice = req.body.minPrice;
            const maxPrice = req.body.maxPrice;

            const query = new Query({ product, minPrice, maxPrice });
            await query.save();
            res.status(200).send('query created in db');
        });

        this.server.get('/queries', async (req, res) => {
            const queries = await Query.find().exec();
            res.status(200).send(queries);
        });

        this.server.delete('/queries', async (req, res) => {
            Query.deleteMany({}, () => {
                res.status(200).send('queries deleted');
            });
        });

        this.server.put('/queries', async (req, res) => {
            const id = req.body.id;
            Query.deleteOne({ _id: id }, () => {
                res.status(200).send('query deleted');
            });
        });

        this.server.get('/results', async (req, res) => {
            const results = await Result.find().exec();
            res.status(200).send(results);
        });

        this.server.delete('/results', async (req, res) => {
            Result.deleteMany({}, () => {
                res.status(200).send('results deleted');
            });
        });
    }

    private async start() {
        if (this.subscription && !this.subscription.closed) {
            this.subscription.unsubscribe();
        }

        let queries = await Query.find().exec();
        const newResults = await sendApiRequest(queries, this.queryInterval);
        await this.saveResults(newResults);
        this.subscription = interval(this.queryInterval * 1000).subscribe(async () => {
            queries = await Query.find().exec();
            console.log(`sending request at ${new Date().toLocaleTimeString()}`);
            const newRes = await sendApiRequest(queries, this.queryInterval);
            await this.saveResults(newRes);
        });
    }

    private async saveResults(newResults) {
        if (newResults.length > 0) {
            const existingResults = await Result.find().exec();
            newResults = newResults.filter(res => !existingResults.find(existingRes => existingRes.id === res._id));
            if (newResults.length > 0) {
                await this.sendMessageToDevices();
            }
            for (const result of newResults) {
                const newResult = new Result(
                    {
                        id: result._id,
                        product: result._source.product,
                        oldPrice: result._source.old_price,
                        newPrice: result._source.new_price,
                        discount: result._source.percent,
                        shop: result._source.shop,
                        url: atob(result._source.key_id)
                    });
                await newResult.save();
            }
        }
    }

    private async sendMessageToDevices() {
        const devices = await DeviceId.find().exec();
        for (const result of devices) {
            this.firebase.messaging().sendToDevice(result.deviceId,
                {
                    notification: {
                        title: 'New results',
                        body: 'Look into app for new results',
                    }
                },
                options);
        }
    }
}
