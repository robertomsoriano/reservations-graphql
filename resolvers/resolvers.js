import { AuthError } from "../errors/index.js";

// TODO: Separate resolvers by category

const moment = require("moment");
const { createToken, auth } = require("../utils/jwt.js");
const { hashPass, comparePass } = require("../utils/bcrypt.js");

const sampleItems = [
  { name: "Apple" },
  { name: "Banana" },
  { name: "Orange" },
  { name: "Melon" }
];

export default {
  Query: {
    posts: async (parent, args, { models }) => {
      const Posts = await models.Post.find({}).sort({
        createdOn: -1
      });
      return Posts;
    },
    users: async (parent, args, { models }) => {
      const Users = await models.User.find({});
      return Users;
    },
    // Get a user by it ID
    fetchUser: async (_, { id }, { models, request }) => {
      const token = await request.headers.authorization;
      const user = await auth(token);
      return await models.User.findById(user.id);
    },
    fetchBusiness: async (_, { id }, { models, request }) => {
      try {
        const token = await request.headers.authorization;
        const user = await auth(token);
        const account = await models.User.findById(user.id).select("-password");
        if (id !== account.business) {
          throw new Error("User doesn't have a registered business!");
        }
        return await models.Business.findById(account.business);
      } catch (e) {
        throw new Error("User doesn't have a registered business!");
      }
    },
    getAllBusinesses: async (_, {}, { models }) => {
      return await models.Business.find().select("-password");
    },
    reservations: async (parent, args, { models }) => {
      const Reservations = await models.Reservation.find({}).sort({
        createdOn: -1
      });
      return Reservations;
    },
    items: async () => {
      return sampleItems;
    }
  },
  /* ===================================================================== */
  User: {
    async reservations(_, args, { models }) {
      return await models.Reservation.find({ user: _.id }).sort({
        createdOn: -1
      });
    },
    async business(_, args, { models }) {
      let { business } = _;
      return await models.Business.findById(business).sort({
        createdOn: -1
      });
    }
  },
  Business: {
    async user(_, args, { models }) {
      return await models.User.findById(_.user).select("-password");
    },
    async customers(_, args, { models }) {
      return await models.User.findById(_.user).select("-password");
    },
    async reservations(_, args, { models }) {
      return await models.Reservation.find({ business: _.id }).sort({
        createdOn: -1
      });
    }
  },
  Reservation: {
    async user(_, args, { models }) {
      try {
        return await models.User.findById(_.user).select("-password");
      } catch (e) {
        return Error("You cant see user's password");
      }
    },
    async business(_, args, { models }) {
      return await models.Business.findById(_.business);
    }
  },

  /* ===================================================================== */
  Mutation: {
    // Posts CRUD Operations

    createPost: async (parent, { title, desc, author }, { models }) => {
      // create a new post
      const newPost = new models.Post({
        title,
        desc,
        author
      });

      // save the post
      try {
        await newPost.save();
      } catch (e) {
        throw new Error("Cannot Save Post!!!");
      }

      return true;
    },
    updatePost: (parent, { id, title, desc, author }, { models }) => {
      try {
        models.Post.findById(id).then(post => {
          (post.title = title), (post.desc = desc), (post.author = author);
          post.save();
        });
      } catch (e) {
        throw new Error("Post could not be deleted, Please check id.");
      }
      return true;
    },
    deletePost: (parent, { id }, { models }) => {
      try {
        models.Post.findById(id).then(post => post.remove());
        // await models.Post.deleteOne({ _id: ObjectId(id) });
      } catch (e) {
        throw new Error("Post could not be deleted, Please check id.");
      }
      return true;
    },
    /* ===================================================================== */
    // User CRUD Operations

    // @desc    Register new user
    // @access  Public
    createUser: async (
      parent,
      { fname, lname, email, password, address, phone },
      { models }
    ) => {
      if (!fname || !lname || !email || !password) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      const User = await models.User.findOne({ email });
      if (User || (User && User.email == email)) {
        throw new Error("Email is already taken.");
      }
      // reservations: [Reservation],
      // register_date: Date!,
      // role: [String!]
      /*-------------------------------*/
      // create a new user
      const newUser = new models.User({
        fname,
        lname,
        email,
        password,
        address,
        phone
      });
      const hash = await hashPass(newUser.password);
      newUser.password = hash;
      const user = await newUser.save();
      return await {
        token: createToken(user, "secret", 3600),
        user: {
          id: user.id,
          fname: user.fname,
          lname: user.lname,
          email: user.email
        }
      };
    },
    signIn: async (parent, { email, password }, { models }) => {
      // Simple validation
      if (!email || !password) {
        return { msg: "Please enter all fields" };
      }
      // Check for existing user
      const User = await models.User.findOne({ email });
      if (!User) {
        throw new AuthError("User Doesn't Exist! Please Register.");
      } else if ((await comparePass(password, User)) === false) {
        throw new Error("Invalid credentials");
      }
      return await {
        token: createToken(User, "secret", 3600), //TODO: Replace with ENV VAR
        user: {
          id: User.id,
          fname: User.fname,
          lname: User.lname,
          email: User.email,
          business: User.business
        }
      };
    },
    updateUserByEmail: async (
      parent,
      { name, email, password },
      { models, request }
    ) => {
      const token = request.headers.authorization;
      const user = await auth(token);
      //If email used in the request doesn't match the user in the token, throw error.
      if (!user || user.email !== email) {
        throw new Error("Invalid Credentials");
      }
      //Find User by Email and then update
      let account = await models.User.findOneAndUpdate(
        { email },
        { name, email },
        {
          new: true
        }
      );
      return true;
      // });
    },
    updateUserPass: async (
      parent,
      { email, password, newPassword },
      { models, request }
    ) => {
      const token = request.headers.authorization;
      const user = await auth(token);
      if (!user || user.email !== email) {
        throw new Error("Invalid Credentials");
      }
      const User = await models.User.findOne({ email: user.email });
      if (!comparePass(password, User)) {
        throw new Error("Invalid Credentials");
      }
      const hash = await hashPass(newPassword);
      let account = await models.User.findOneAndUpdate(
        { email },
        { email, password: hash },
        {
          new: true
        }
      );
      return true;
      // });
    },
    deleteUser: async (parent, { id }, { models, request }) => {
      const token = request.headers.authorization;
      const user = await auth(token);
      if (!user || user.id !== id) {
        throw new Error("Invalid Credentials");
      }
      try {
        models.User.findById(id).then(toBeDel => {
          if (toBeDel.id !== user.id) {
            throw new Error("Invalid user id.");
          }
          toBeDel.remove();
        });
      } catch (e) {
        throw new Error("User could not be deleted, Please check id.");
      }
      return true;
    },
    /* ===================================================================== */
    //  Businesses
    createBusiness: async (
      parent,
      { email, name, address, phone, categories, services },
      { models, request }
    ) => {
      // The payload must contain these
      if (!email || !name || !address) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      // Validate user token
      const token = request.headers.authorization;
      const user = await auth(token);
      if (!user) {
        throw new Error("You Must be logged in to register a Business");
      }
      // check if business exists
      const Business = await models.Business.findOne({ email });
      if (Business || (Business && Business.email == email)) {
        throw new Error("Business Email is already taken.");
      }
      try {
        // create a new business
        return (async () => {
          let srv = services.split(",");
          srv.forEach(x => x.trim());
          const newBusiness = await new models.Business({
            user: user.id,
            email,
            name,
            address,
            phone,
            categories,
            services: srv
          });
          await newBusiness.save();
          // Link business to user account
          const User = await models.User.findOneAndUpdate(
            { _id: user.id },
            { business: newBusiness.id }
          );
          return await {
            token: createToken(User, "secret", 3600),
            user: {
              id: User.id,
              fname: User.fname,
              lname: User.lname,
              email: User.email,
              business: await newBusiness.id
            }
          };
        })();
      } catch (e) {
        console.log(e);
        throw new Error("Business could not be registered");
      }
    },
    businessSignIn: async (parent, { email, password }, { models }) => {
      // Simple validation
      if (!email || !password) {
        return { msg: "Please enter all fields" };
      }
      // Check for existing Business
      const User = await models.Business.findOne({ email });
      if (!User) {
        return { msg: "User Does not exist" };
      }
      if ((await comparePass(password, User)) === false) {
        throw new Error("Invalid credentials");
      }
      return await {
        token: createToken(User, "secret", 3600),
        business: {
          id: User.id,
          name: User.name,
          email: User.email
        }
      };
    },
    updateBusiness: async (
      parent,
      { id, name, address, services },
      { models }
    ) => {
      // update business
      try {
        await models.Business.findById(id).then(bus => {
          (bus.name = name),
            (bus.address = address),
            (bus.services = [services]);
          bus.save();
        });
      } catch (e) {
        console.log(e);
        throw new Error("Cannot update Business!!!");
      }

      return true;
    },
    addBusinessServices: async (parent, { id, service }, { models }) => {
      // update business
      try {
        await models.Business.findById(id).then(bus => {
          let services = service.split(",");
          services.forEach(x => x.trim());
          services.forEach(ele => {
            if (!bus.services.includes(String(ele))) {
              bus.services.push(ele);
            }
          });
          bus.save();
        });
      } catch (e) {
        console.log(e);
        throw new Error("Cannot add service Business!!!");
      }

      return true;
    },

    // Reservations

    createReservation: async (
      parent,
      { business, service, desc, date, time },
      { models, user }
    ) => {
      const User = await models.User.findById(user.id);
      if (!User) return { msg: "User Not Found" };
      // create reservation
      /* defaults for every new reservation*/
      let status = "Pending";
      let log = "Reservation created";
      const reservation = await new models.Reservation({
        user: User.id,
        business,
        service,
        desc,
        date: moment(date, "MM/DD/YYYY"),
        time,
        createdOn: moment().format("LLL"),
        status: `${status}`,
        log: `${log}. Status ${status}. At ${moment().format("LLL")}.`
      });
      try {
        await reservation.save();
      } catch (e) {
        console.log(e);
        throw new Error("Cannot create reservation!!!");
      }

      return true;
    },
    // Reservation Updates
    updateReservation: async (
      parent,
      { id, service, date, time, status, log },
      { models, user }
    ) => {
      const User = await models.User.findById(user.id);
      if (!User) return { msg: "User Not Found" };
      // update reservation
      try {
        const reservation = await models.Reservation.findOneAndUpdate(
          { _id: id },
          {
            // Update Logs
            $push: {
              log: `${log}. Status ${status}. At ${moment().format("LLL")}.`
            },
            service,
            date: Date(date),
            time,
            status: `${status}`
          },
          { new: true }
        );
        return reservation;
      } catch (e) {
        console.log(e);
        throw new Error("Cannot update reservation!!!");
      }
    },
    // Cancel Reservations
    cancelReservation: async (parent, { id }, { models, user }) => {
      const User = await models.User.findById(user.id);
      if (!User) return { msg: "User Not Found" };
      // cancel reservation
      /* defaults for every new reservation*/
      let status = "Cancelled";
      let log = "Reservation created";
      try {
        const reservation = await models.Reservation.findOneAndUpdate(
          { _id: id },
          {
            $push: {
              log: `${log}. Status ${status}. At ${moment().format("LLL")}.`
            },
            status: `${status}`
          },
          { new: true }
        );
        return reservation;
      } catch (e) {
        console.log(e);
        throw new Error("Cannot cancel reservation!!!");
      }
    },
    // Complete Reservations
    completeReservation: async (parent, { id }, { models, user }) => {
      const User = await models.User.findById(user.id);
      if (!User) return { msg: "User Not Found" };
      // complete reservation
      /* defaults for every new reservation*/
      let status = "Completed";
      let log = "Reservation successfully fulfilled!";
      try {
        const reservation = await models.Reservation.findOneAndUpdate(
          { _id: id },
          {
            $push: {
              log: `${log}. Status ${status}. At ${moment().format("LLL")}.`
            },
            status: `${status}`
          },
          { new: true }
        );
        return reservation;
      } catch (e) {
        console.log(e);
        throw new Error("Cannot cancel reservation!!!");
      }
    },
    // Feedback for Reservations
    feedbackReservation: async (
      parent,
      { id, feedback, rating },
      { models, user }
    ) => {
      const User = await models.User.findById(user.id);
      if (!User) return { msg: "User Not Found" };
      // complete reservation
      try {
        const reservation = await models.Reservation.findOneAndUpdate(
          { _id: id },
          {
            status: `${status}`,
            feedback,
            rating
          },
          { new: true }
        );
        return reservation;
      } catch (e) {
        console.log(e);
        throw new Error("Cannot cancel reservation!!!");
      }
    }

    // Services
    /* ===================================================================== */
  }
};
