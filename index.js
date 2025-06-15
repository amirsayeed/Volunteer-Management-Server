const express = require('express')
const cors = require('cors');
const {
    MongoClient,
    ServerApiVersion,
    ObjectId
} = require('mongodb');
const app = express();
const port =
    process.env.PORT || 5000;
require('dotenv').config();


app.use(cors());
app.use(express.json());


const verifyFbToken = async (req, res, next) => {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({
            message: 'unauthorized access'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        //console.log('decoded token', decoded);
        req.decoded = decoded;
        next();
    } catch (error) {
        return res.status(401).send({
            message: 'unauthorized access'
        });
    }
}

const verifyTokenEmail = (req, res, next) => {
    if (req.query.email !== req.decoded.email) {
        return res.status(403).send({
            message: 'forbidden access'
        })
    }
    next();
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tnmpmcr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


var admin = require("firebase-admin");

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// var serviceAccount = require("./firebase-admin-service-key.json");


async function run() {
    try {

        // await client.connect();

        // await client.db("admin").command({
        //     ping: 1
        // });
        const volunteersNeedCollection = client.db("volunteerNeed_db").collection("volunteers");
        const volunteersRequestsCollection = client.db("volunteerNeed_db").collection("requestedVolunteers");

        app.get('/addVolunteerNeedPost', async (req, res) => {
            const {
                searchParams
            } = req.query;

            let query = {};

            if (searchParams) {
                query = {
                    title: {
                        $regex: searchParams,
                        $options: "i"
                    }
                };
            }

            const result = await volunteersNeedCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/addVolunteerNeedPost/:id', verifyFbToken, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await volunteersNeedCollection.findOne(query);
            res.send(result);
        })

        app.post('/addVolunteerNeedPost', verifyFbToken, async (req, res) => {
            const newVolunteerNeedData = req.body;
            const result = await volunteersNeedCollection.insertOne(newVolunteerNeedData);
            res.send(result);
        })

        app.delete('/addVolunteerNeedPost/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await volunteersNeedCollection.deleteOne(query);
            res.send(result);
        })


        app.put('/addVolunteerNeedPost/:id', verifyFbToken, async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: new ObjectId(id)
            };
            const updatedData = req.body;
            const updatedDoc = {
                $set: updatedData
            }
            const result = await volunteersNeedCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.get('/volunteerNeedsNow', async (req, res) => {
            const sortField = {
                "deadline": 1
            }
            const result = await volunteersNeedCollection.find().sort(sortField).limit(6).toArray();
            res.send(result);
        })

        //my volunteer need post
        app.get('/myVolunteerNeedPost', verifyFbToken, verifyTokenEmail, async (req, res) => {
            const email = req.query.email;

            const query = {
                oemail: email
            };
            const result = await volunteersNeedCollection.find(query).toArray();
            res.send(result);
        })


        //req to be a volunteer
        app.post('/volunteerRequest/:postId', async (req, res) => {
            const id = req.params.postId;
            const newVolunteerInfo = req.body;
            const result = await volunteersRequestsCollection.insertOne(newVolunteerInfo);
            if (result.acknowledged) {
                await volunteersNeedCollection.updateOne({
                    _id: new ObjectId(id)
                }, {
                    $inc: {
                        noOfVolunteers: -1,
                    },
                })
            }
            res.send(result);
        })

        //my volunteer request post
        app.get('/myVolunteerRequests', verifyFbToken, verifyTokenEmail, async (req, res) => {
            const email = req.query.email;

            const query = {
                vemail: email
            }
            const result = await volunteersRequestsCollection.find(query).toArray();
            res.send(result);
        })

        app.delete('/myVolunteerRequests/:id', async (req, res) => {
            const id = req.params.id;
            const {
                postId
            } = req.body;
            const query = {
                _id: new ObjectId(id)
            };
            const reqData = await volunteersRequestsCollection.deleteOne(query);
            if (reqData.acknowledged) {
                await volunteersNeedCollection.updateOne({
                    _id: new ObjectId(postId)
                }, {
                    $inc: {
                        noOfVolunteers: 1
                    }
                })
            }
            res.send(reqData)
        })

        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Volunteer Management is running')
})

app.listen(port, () => {
    console.log(`Volunteer Management is running on port: ${port}`)
})