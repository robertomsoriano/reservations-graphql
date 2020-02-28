// IN PROCESS...
// TODO: Separate resolvers by category
// Merge all resolvers using the following:
// import { merge } from "lodash";
// const rslvrs = merge(resolvers, usersResolvers);

module.exports = {
  // User CRUD Operations

  // @desc    Register new user
  // @access  Public
  createUser: async (
    parent,
    { name, username, email, password },
    { models }
  ) => {
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }
    const User = await models.User.findOne({ username });
    if (User || (User && User.email == email)) {
      throw new Error("Email/Username is already taken.");
    }
    // create a new user
    const newUser = new models.User({
      name,
      username,
      email,
      password
    });
    const hash = await hashPass(newUser.password);
    newUser.password = hash;
    const user = await newUser.save();
    return await {
      token: createToken(user, "secret", 3600),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    };
  },
  signIn: async (parent, { username, password }, { models }) => {
    // Simple validation
    if (!username || !password) {
      return { msg: "Please enter all fields" };
    }
    let identifier = username;
    // Check for existing user
    const User = await models.User.findOne({ username: identifier });
    if (!User) {
      return { msg: "User Does not exist" };
    }
    if ((await comparePass(password, User)) === false) {
      throw new Error("Invalid credentials");
    }
    return await {
      token: createToken(User, "secret", 3600),
      user: {
        id: User.id,
        name: User.name,
        username: User.username,
        email: User.email
      }
    };
  },
  updateUserByEmail: async (
    parent,
    { name, username, email, password },
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
      { name, username, email },
      {
        new: true
      }
    );
    return true;
    // });
  },
  updateUserPass: async (
    parent,
    { username, email, password, newPassword },
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
      { username, email, password: hash },
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
  }
};
