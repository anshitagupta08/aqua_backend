const { Request, Response } = require('express');
const CallDisposition = require('../../models/Master/CallDisposition');


const getAllCallDispositions = async(req, res) => {
    try {
        const callDisposition = await CallDisposition.findAll({
          attributes: ['id', 'disposition_name', 'description'],
          where: { is_active: true }, 
          order: [['disposition_name', 'ASC']], // Optional: alphabetically sorted
        });
    
        res.json({ success: true, data: callDisposition });
      } catch (error) {
        console.error('Error fetching  call dispositions:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
};


module.exports ={
    getAllCallDispositions,
};