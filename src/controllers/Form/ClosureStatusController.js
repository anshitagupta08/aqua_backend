const { Request, Response } = require('express');
const FinalClosureStatus = require('../../models/Master/FinalClosureStatus');


const getAllFinalClosureStatus = async(req, res) => {
    try {
        const finalClousreStatus = await FinalClosureStatus.findAll({
          attributes: ['id', 'status_name', 'description'],
          where: { is_active: true }, // Optional: only fetch active support types
          order: [['status_name', 'ASC']], // Optional: alphabetically sorted
        });
    
        res.json({ success: true, data: finalClousreStatus });
      } catch (error) {
        console.error('Error fetching final closure status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
};


module.exports ={
    getAllFinalClosureStatus,
};