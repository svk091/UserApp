/*          ASSINGNMENT
    connect to MongoDB
1./signup    -> (username,password) add credentials to DB
2./signin    -> by jwt athuntication
3./users    -> return users
*/

const express = require('express');
const mongoose = require('mongoose');
const z = require('zod');
const jwt = require('jsonwebtoken')

const app = express();
const secretKey =  "EveryDayIsNotSunday"; 

app.use(express.json());

mongoose.connect('mongodb+srv://vamsikrishna:krixxxxxxx@krdb.notjpqi.mongodb.net/UserApp');

const userSchema = mongoose.Schema({
    email : String,
    password: String
});

const Users = mongoose.model('Users', userSchema);

async function checkIfUserExists(emailToCheck, passwordToCheck) {
    const query = passwordToCheck ? { email : emailToCheck, password : passwordToCheck} : {email : emailToCheck};
    const isExists = await Users.findOne(query);
    return !!isExists;
}


const credentialSchema = z.object({
    email : z.string().email(),
    password : z.string().min(8).regex(/[a-zA-Z]/).regex(/\d/)
})

app.post('/signup', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const validateCredentials = credentialSchema.safeParse({
        email : email,
        password : password
    })

    if(!validateCredentials.success) {
        return res.json({
            msg : 'Invalid input. Please correct and try again'
        })
    }

    const userExists = await checkIfUserExists(email);
    if(userExists) {
        return res.json({
            msg : 'The email address is already in use'
        })
    }else{
        const user = new Users({
            email : email,
            password : password
        });
        user.save()
            .then(() => {
                return res.json({
                    msg : "Successfully Signedup"
                })
            })
    }
});

app.post('/signin', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const userExists = await checkIfUserExists(email, password);

    if(!userExists) {
        return res.json({
            msg : "Incorrect Username or Password"
        })
    } 

    const payload = { email : email,password : password};
    

    const token = jwt.sign(payload, secretKey);
    return res.json({
        token
    })
})
app.get('/users', async (req, res) => {
    const token = req.headers.authorization;
    try{
        if(!token) {
            return res.json({
                msg : 'token missing'
            })
        }

        const decoded = jwt.verify(token, secretKey);

        const email = decoded.email;
        
        const otherUsers = await Users.find({});
        return res.json({otherUsers})
    }catch(err) {
        return res.status(403).json({
            msg : "Error",
        })
    }
    

})

app.listen(3000, () => {
    console.log('Server Started....')
});
