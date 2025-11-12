import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';

// Get all users with pagination, filtering, and sorting
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      role,
      search,
    } = req.query;

    // Build filter query
    const filter: any = {};
    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }
    if (role) {
      filter.role = Array.isArray(role) ? { $in: role } : role;
    }
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

// Get single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

// Create new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, username, email, phoneNumber, password, role, status } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email or username already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      status: status || 'active',
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    } else if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message,
      });
    }
  }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, username, email, phoneNumber, password, role, status } = req.body;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check for duplicate username or email
    if (username || email) {
      const duplicateUser = await User.findOne({
        _id: { $ne: id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      });

      if (duplicateUser) {
        res.status(400).json({
          success: false,
          message: 'Username or email already exists',
        });
        return;
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (role) user.role = role;
    if (status) user.status = status;

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userResponse,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    } else if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message,
      });
    }
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

// Invite user (creates user with 'invited' status and sends email)
export const inviteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Generate temporary username and password
    const tempUsername = email.split('@')[0] + '_' + Date.now();
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      firstName: 'Invited',
      lastName: 'User',
      username: tempUsername,
      email,
      phoneNumber: 'N/A',
      password: hashedPassword,
      role,
      status: 'invited',
    });

    // TODO: Send invitation email with temp password
    // await sendInvitationEmail(email, tempPassword);

    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(201).json({
      success: true,
      message: 'User invited successfully',
      data: userResponse,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    } else if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error inviting user',
        error: error.message,
      });
    }
  }
};

// Bulk delete users
export const bulkDeleteUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs',
      });
      return;
    }

    const result = await User.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} user(s) deleted successfully`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting users',
      error: error.message,
    });
  }
};