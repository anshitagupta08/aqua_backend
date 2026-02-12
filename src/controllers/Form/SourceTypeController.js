const { Request, Response } = require('express');
const SourceType = require('../../models/Master/SourceType');


const getAllCallSourceType = async(req, res) => {
    try {
        const callSourceType = await SourceType.findAll({
          attributes: ['id', 'source_name', 'description'],
          where: { is_active: true }, 
          order: [['source_name', 'ASC']], 
        });
    
        res.json({ success: true, data: callSourceType });
      } catch (error) {
        console.error('Error fetching  source type:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
};


module.exports ={
  getAllCallSourceType,
};