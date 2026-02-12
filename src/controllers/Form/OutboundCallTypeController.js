const { Request, Response } = require('express');
const OutboundCallType = require('../../models/Master/OutboundCallType');


const getAllOutboundCallTypes = async(req, res) => {
    try {
        const outboundCallType = await OutboundCallType.findAll({
          attributes: ['id', 'type_name', 'description'],
          where: { is_active: true }, // Optional: only fetch active support types
          order: [['type_name', 'ASC']], // Optional: alphabetically sorted
        });
    
        res.json({ success: true, data: outboundCallType });
      } catch (error) {
        console.error('Error fetching outbound call types:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
};


module.exports ={
    getAllOutboundCallTypes,
};