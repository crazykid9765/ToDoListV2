//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// mongoose connection
// mongoose.connect("mongodb://localhost:27017/tasksDB");

mongoose.connect("mongodb+srv://admincrazy:crazykid123@cluster0.38auv.mongodb.net/tasksDB");
// Tasks schema
const taskSchema = new mongoose.Schema({
  name: String
});
// Task Model
const Task = mongoose.model("Task", taskSchema);

// Create Lists Schema and model
const listSchema = {
  name: String,
  items: [taskSchema]
}
const Lists = mongoose.model("List", listSchema);


// Create default items for TODO list and add them to the Collection
const items = ["Buy Food", "Cook Food", "Eat Food"];

const item1 = new Task({
  name: "Buy Food"
});
const item2 = new Task({
  name: "Cook Food"
})
const item3 = new Task({
  name: "Eat Food"
})

const defaultItems = [item1, item2, item3];



const workItems = [];

app.get("/", function(req, res) {

  const day = date.getDate();
  Task.find({}, function(err, tasksListFound) {
    if (err) {
      console.log(err);
    } else if (tasksListFound.length === 0) {
      Task.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Inserted Default Tasks successfully!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: tasksListFound
      });
    }
  })


});

app.post("/", function(req, res) {

  const item = req.body.newItem;
  const listName = req.body.list;
  const task = new Task({
    name: item
  });
  if (req.body.list === "Today") {
    task.save();
    res.redirect("/");
  } else {

    Lists.findOne({
      name: listName
    }, function(err, listFound) {
      if (err) {
        console.log(err);
      } else {
        if (listFound) {
          listFound.items.push(task);
          listFound.save();
          res.redirect("/" + listName);
        } else {
          console.log("List with name " + listName + " Not found");
        }
      }
    })
  }
});

app.post("/delete", function(req, res) {
      const checkedItem = req.body.taskCompleted;
      const listName = req.body.list;

      if (listName === "Today") {
        Task.findByIdAndRemove(checkedItem, function(err) {
          if (err) {console.log(err);
          }else {console.log('Item deleted successfully!')}
        });
        res.redirect("/");
      } else {
        Lists.findOneAndUpdate({
            name: listName
          }, {
            $pull: {
              items: {
                _id: checkedItem
              }
            }
          },
          function(err, listFound) {
            if (err) {
              console.log(err);
            } else {
              res.redirect("/" + listName);
            }
          })
      }
    })


    app.get("/:newListName", function(req, res) {
      const customListName = req.params.newListName;

      Lists.findOne({
        name: customListName
      }, function(err, recordFound) {
        if (err) console.log(err);
        else {
          if (recordFound) {
            console.log("Record Existed! no need to create new");
            console.log(recordFound.name);
            res.render("list", {
              listTitle: recordFound.name,
              newListItems: recordFound.items
            });
          } else {
            console.log("No list found with name " + customListName + ", so creating default list for this name");
            const listEntry = new Lists({
              name: customListName,
              items: defaultItems
            });
            listEntry.save();
            res.redirect("/" + customListName);
          }
        }
      });
    });

    app.get("/about", function(req, res) {
      res.render("about");
    });

    app.listen(3000, function() {
      console.log("Server started on port 3000");
    });
