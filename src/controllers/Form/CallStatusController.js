const { Request, Response } = require('express');
const CallAttemptStatus = require('../../models/Master/CallAttemptStatus');


const getAllCallAttemptStatus = async(req, res) => {
    try {
        const callAttemptStatus = await CallAttemptStatus.findAll({
          attributes: ['id', 'status_name', 'description'],
          where: { is_active: true }, // Optional: only fetch active support types
          order: [['status_name', 'ASC']], // Optional: alphabetically sorted
        });
    
        res.json({ success: true, data: callAttemptStatus });
      } catch (error) {
        console.error('Error fetching  call Status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
};


module.exports ={
    getAllCallAttemptStatus,
};