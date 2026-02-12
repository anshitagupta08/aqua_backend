const { Request, Response } = require('express');
const OutcomeTag = require('../../models/Master/OutcomeTag');


const getAllOutcomeTag = async(req, res) => {
    try {
        const outcomeTag = await OutcomeTag.findAll({
          attributes: ['id', 'tag_name', 'description'],
          where: { is_active: true }, 
          order: [['tag_name', 'ASC']], 
        });
    
        res.json({ success: true, data: outcomeTag });
      } catch (error) {
        console.error('Error fetching outcome tag:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
};


module.exports ={
    getAllOutcomeTag,
};