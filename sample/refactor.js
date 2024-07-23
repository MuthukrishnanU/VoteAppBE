import express from 'express';
import * as mongodb from 'mongodb';
import cors from 'cors';
const app = express();
const mongoDBURL = "mongodb+srv://muthuk60:mongo1046@voteappmean.rjibaau.mongodb.net/?retryWrites=true&w=majority&appName=VoteAppMEAN";
app.get('/', (request, response) => { return response.status(234).send('Welcome To VoteAppBE')} );
const collections = {};
async function connectToDatabase(uri) {
    const client = new mongodb.MongoClient(uri);
    await client.connect();
    const db = client.db("voteApp");
    collections.users = db.collection("users");
    collections.viewResult = db.collection("viewResult");
}
connectToDatabase(mongoDBURL).then(() => {
    app.use(express.json());
    app.use(cors());
    app.get('/getusers', async (_req, res) => {
        try {
            const users = await collections?.users?.find({}).toArray();
            res.status(200).send(users);
        } catch (error) { res.status(500).send(error instanceof Error ? error.message : "Unknown error") }
    });
    app.post('/login', async (req, res) => {
        try{
            const loginUserDetail = await collections?.users?.find({ employeeId: req.body.employeeId }).toArray();
            const viewResultArr = await collections?.viewResult?.find({}).toArray();
            let viewResultVal = viewResultArr[0].viewResult;
            if(loginUserDetail.length==0){ res.status(404).send({'error':'UNF','message':'User Not Found'}) }
            else{
                if(loginUserDetail[0].password==req.body.password){
                    let fetchVoteCandidates = await collections?.users?.find({}).toArray();
                    let updatedVotersArr = [];
                    fetchVoteCandidates.forEach(f => updatedVotersArr.push({"employeeId": f.employeeId, "name": f.name, "gender": f.gender, "hasVoted": f.hasVoted}) );
                    res.status(200).send({loginUserDetail, updatedVotersArr, viewResultVal});
                }
                else{ res.status(401).send({'error':'LPM','message':'Login Password Mismatch'}) }
            }
        } catch (error) { res.status(500).send(error instanceof Error ? error.message : "Unknown error") }
    });
    app.post('/register', async (req, res) => {
        try{
            const checkRegUser = await collections?.users?.find({ employeeId: req.body.employeeId }).toArray();
            if(checkRegUser.length > 0){ res.status(403).send({'error':'UAE','message':'User Already Exists'}) }
            else{
                const regReqObj = { employeeId: req.body.employeeId, name: req.body.name, password: req.body.password, gender: req.body.gender, hasVoted: false, gotVotes: [''] };
                const regResult = await collections?.users?.insertOne(regReqObj);
                const usersListAfterReg = await collections?.users?.find({}).toArray();
                if(regResult?.acknowledged) { res.status(201).send({"response":usersListAfterReg,"message": `Created a new user: ID ${regResult.insertedId}.`}) }
                else{ res.status(500).send({"error":"REGERR","message":"Failed to create a new employee."}) }
            }
        } catch(error){ res.status(500).send(error instanceof Error ? error.message : "Unknown error") }
    });
    app.post('/userVote', async (req, res) => {
        try{
            const checkExistUser = await collections?.users?.find({ employeeId: req.body.employeeId }).toArray();
            if(checkExistUser.length == 0){ res.status(404).send({'error':'UNF','message':'User Not Found'}) }
            else{
                let registeredUsersListForVote = await collections?.users?.find({}).toArray();
                let removeDups = (arr) => { return [...new Set(arr)] };
                async function castVotes(){
                    let registeredUsersListForVoteCast = await collections?.users?.find({}).toArray();
                    registeredUsersListForVoteCast.forEach(async u => {
                        if(u.employeeId == req.body.maleChoice){
                            let updateVotesForMale = [...u.gotVotes, req.body.employeeId];
                            updateVotesForMale = removeDups(updateVotesForMale);
                            collections?.users?.updateOne({"employeeId": req.body.maleChoice}, {$set: {gotVotes: updateVotesForMale}});
                        }
                        if(u.employeeId == req.body.femaleChoice){
                            let updateVotesForFemale = [...u.gotVotes, req.body.employeeId];
                            updateVotesForFemale = removeDups(updateVotesForFemale);
                            collections?.users?.updateOne({"employeeId": req.body.femaleChoice}, {$set: {gotVotes: updateVotesForFemale}});
                        }
                    });
                    const voteResult = await collections?.users?.updateOne({ "employeeId": req.body.employeeId }, { $set: {"hasVoted": true} });
                    const usersListAfterVote = await collections?.users?.find({}).toArray();
                    if(voteResult?.acknowledged){ res.status(201).send({"response":usersListAfterVote,"message": "User Updated"}) }
                    else{ res.status(500).send({"error":"REGERR","message":"Failed to create a new employee."}) }
                }
                if(checkExistUser[0].hasVoted){
                    registeredUsersListForVote.forEach(async r => {
                        let tmpVotesArr = [];
                        tmpVotesArr = r.gotVotes;
                        if(tmpVotesArr.includes(req.body.employeeId)){
                            let removedVoteArr = [];
                            removedVoteArr = tmpVotesArr.filter(v => v!==req.body.employeeId);
                            collections?.users?.updateOne({"employeeId": r.employeeId}, {$set: {"gotVotes": removedVoteArr}});
                        }
                    });
                    castVotes();
                } else{ castVotes() }
            }
        } catch (err){ res.status(500).send(error instanceof Error ? error.message : "Unknown error") }
    });
    app.get('/results', async (req, res) => {
        try{
            let registeredUserList = await collections?.users?.find({}).toArray();
            let registeredMaleList = registeredUserList.filter((usr) => usr.gender=='Male');
            let registeredFemaleList = registeredUserList.filter((usr) => usr.gender=='Female');
            let regMaleSort = registeredMaleList.sort(function(a, b){
              if(a.gotVotes.length > b.gotVotes.length){ return 1; }
              if(a.gotVotes.length < b.gotVotes.length){ return -1; }
              return 0;
            });
            let bestDressedMale = regMaleSort.at(-1).name || regMaleSort[regMaleSort.length - 1].name;
            let regFemaleSort = registeredFemaleList.sort(function(c, d){
              if(c.gotVotes.length > d.gotVotes.length){ return 1; }
              if(c.gotVotes.length < d.gotVotes.length){ return -1; }
              return 0;
            });
            let bestDressedFemale = regFemaleSort.at(-1).name || regFemaleSort[regFemaleSort.length - 1].name;
            if(regMaleSort[regMaleSort.length - 1].gotVotes.length==0){ bestDressedMale = 'BestDressedMale' }
            if(regFemaleSort[regFemaleSort.length - 1].gotVotes.length==0){ bestDressedFemale = 'BestDressedFemale' }
            res.status(200).send({bestDressedMale, bestDressedFemale});
        } catch (err){ res.status(500).send(error instanceof Error ? error.message : "Unknown error") }
    });
    console.log('App connected to database');
    app.listen(5000, () => { console.log("App is listening to port: 5000") });
}).catch((error) => { console.log(error) });