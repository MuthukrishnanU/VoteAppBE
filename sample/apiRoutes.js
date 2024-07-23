import express from 'express';
import User from './userModel.js';
const router = express.Router();

// Route for Get All Users from database
/*router.get('/', async (request, response) => {
    try {
      const users = await User.find();
      return response.status(200).json({ data: users });
    } catch (error) {
      console.log(error.message);
      response.status(500).send({ message: error.message });
    }
});*/
router.get("/", async (_req, res) => {
    try {
        const users = await collections?.users?.find({}).toArray();
        res.status(200).send(employees);
    } catch (error) {
        res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
});
export default router;