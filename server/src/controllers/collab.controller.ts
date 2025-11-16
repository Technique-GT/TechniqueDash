import { Request, Response } from 'express';
import Collaborator, { ICollaborator } from '../models/Collab';
import mongoose from 'mongoose';

// Helper function to validate and convert string to ObjectId
const toObjectId = (id: string | undefined): mongoose.Types.ObjectId | null => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return new mongoose.Types.ObjectId(id);
};

export const createCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role } = req.body;
    const userId = (req as any).user?.id; // Assuming you have authentication middleware

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Check if collaborator already exists for this user
    const existingCollaborator = await Collaborator.findOne({ 
      email: email.toLowerCase(), 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (existingCollaborator) {
      res.status(409).json({
        success: false,
        message: 'Collaborator with this email already exists'
      });
      return;
    }

    const collaborator: ICollaborator = new Collaborator({
      name,
      email: email.toLowerCase(),
      role: role || 'Author',
      status: 'pending',
      joinDate: new Date(),
      userId: new mongoose.Types.ObjectId(userId)
    });

    await collaborator.save();
    
    res.status(201).json({
      success: true,
      message: 'Collaborator invitation sent successfully',
      data: collaborator
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Collaborator with this email already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
};

export const getCollaborators = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { search, status } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    let query: any = { userId: new mongoose.Types.ObjectId(userId) };

    // Add search filter
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Add status filter
    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status;
    }

    const collaborators = await Collaborator.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: collaborators,
      count: collaborators.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching collaborators',
      error: error.message
    });
  }
};

export const getCollaboratorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid collaborator ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const collaborator = await Collaborator.findOne({ 
      _id: objectId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!collaborator) {
      res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: collaborator
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching collaborator',
      error: error.message
    });
  }
};

export const updateCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);
    const { name, role, status } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid collaborator ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const collaborator = await Collaborator.findOneAndUpdate(
      { _id: objectId, userId: new mongoose.Types.ObjectId(userId) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!collaborator) {
      res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Collaborator updated successfully',
      data: collaborator
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating collaborator',
        error: error.message
      });
    }
  }
};

export const deleteCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid collaborator ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const collaborator = await Collaborator.findOneAndDelete({ 
      _id: objectId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!collaborator) {
      res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Collaborator deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting collaborator',
      error: error.message
    });
  }
};

export const updateCollaboratorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);
    const { status } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid collaborator ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!status || !['active', 'pending', 'inactive'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Valid status is required (active, pending, or inactive)'
      });
      return;
    }

    const collaborator = await Collaborator.findOneAndUpdate(
      { _id: objectId, userId: new mongoose.Types.ObjectId(userId) },
      { status },
      { new: true, runValidators: true }
    );

    if (!collaborator) {
      res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Collaborator status updated successfully',
      data: collaborator
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating collaborator status',
      error: error.message
    });
  }
};

export const resendInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid collaborator ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const collaborator = await Collaborator.findOne({ 
      _id: objectId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (!collaborator) {
      res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
      return;
    }

    // Here you would typically send an email invitation
    // For now, we'll just update the status to pending and update the join date
    collaborator.status = 'pending';
    collaborator.joinDate = new Date();
    await collaborator.save();

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: collaborator
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error resending invitation',
      error: error.message
    });
  }
};