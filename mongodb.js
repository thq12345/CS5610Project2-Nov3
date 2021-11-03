const router = require("./routes/index.js");
const { MongoClient, ObjectId } = require("mongodb");
// const app = express();
require("dotenv").config();

function myDB() {
  let project_database;
  let username_global;

  const myDB = {};

  // MongoDB Connection URI
  const uri = process.env.MONGO_URL;

  //function to establish connection
  myDB.establishConnection = async () => {
    // Create a new MongoClient
    const client = new MongoClient(uri);
    project_database = client.db("cs5610project2");
    try {
      // Connect the client to the server
      await client.connect();
      // Establish and verify connection
      await client.db("admin").command({ ping: 1 });
      console.log("Connected successfully to server");
    } catch (e) {
      console.log(e);
    }
  };

  //function to insert feedback when called
  myDB.insert_feedback = async (subject, message) => {
    const feedback_database = project_database.collection("Feedback Box");
    const doc = {
      user: username_global,
      subject: subject,
      comment: message,
    };
    const execute = await feedback_database.insertOne(doc);
    console.log("Feedback Successfully Submitted!");
  };

  //function to use when creating an account
  myDB.create_account = async (username, password, res) => {
    const collection_info = project_database.collection("Username_Password");
    const query = {
      username: username,
    };
    const execute = await collection_info.findOne(query);

    if (execute != null) {
      res.redirect("/account-already-exists");
    } else {
      myDB
        .insert_username_password(username, password, collection_info)
        .catch(console.dir);
      username_global = username;
      res.redirect("/login");
    }
  };

  //function to use when editing a feedback
  myDB.edit_feedback = async (originalId, editedtext, editedSubject) => {
    const feedback_database = project_database.collection("Feedback Box");
    const query = { _id: ObjectId(originalId) };
    const updateDoc = {
      $set: {
        comment: editedtext,
        subject: editedSubject,
      },
    };
    const execute = await feedback_database.updateOne(query, updateDoc);
    console.log("Comment successfully edited!");
    //Attempt to reload comments.
    myDB.getComments().catch(console.dir);
  };

  //function to use when deleting a feedback
  myDB.delete_feedback = async (originalId) => {
    const feedback_database = project_database.collection("Feedback Box");
    const query = { _id: ObjectId(originalId) };
    console.log(query);
    const execute = feedback_database.deleteOne(query);
    console.log("Comment successfully deleted!");
    //Attempt to reload comments.
    myDB.getComments().catch(console.dir);
  };

  //function to use when inserting username and password
  myDB.insert_username_password = async (
    username,
    password,
    collection_info
  ) => {
    const write_info = {
      username: username,
      password: password,
    };
    const execute = await collection_info.insertOne(write_info);
    console.log("A Username Password Pair has been inserted successfully.");
  };

  //Process to handle user-submitted username and password
  myDB.process_username_password_input = async (username, password, res) => {
    const collection_info = project_database.collection("Username_Password");
    const query = {
      username: username,
    };
    const execute = await collection_info.findOne(query);
    if (execute == null) {
      res.redirect("/login-error");
    } else {
      if (password == execute.password) {
        username_global = username;
        let query2;
        if (username === "admin@admin") {
          query2 = {};
        } else {
          query2 = { user: username };
        }

        const comment_db = project_database.collection("Feedback Box");
        let comment_json = [];

        const comment_retrieved = await comment_db
          .find(query2)
          .forEach(function (doc) {
            comment_json.push(doc);
          });

        const user_comment = res.redirect("/feedback");

        return comment_json;
      } else {
        res.redirect("/login-error");
        return;
      }
    }
  };

  myDB.getComments = async () => {
    console.log("Reload comment has been executed.");
    let query2;
    if (username_global === "admin@admin") {
      query2 = {};
    } else {
      query2 = { user: username_global };
    }
    const comment_db = project_database.collection("Feedback Box");
    return await comment_db.find(query2).toArray();
  };

  //get counts from certain collections
  myDB.getCounts = async (col_name) => {
    const performance_db = project_database.collection(col_name);
    return await performance_db.count();
  };

  return myDB;
}

module.exports = myDB();
