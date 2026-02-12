const { Request, Response } = require('express');
const QueryType = require('../../models/Form/QueryType');

exports.getAllQueryTypes = async (req, res) => {
  try {
    const { supportTypeId } = req.query;

    const whereCondition = { isActive: true };

    // Add filter if supportTypeId is present
    if (supportTypeId) {
      whereCondition.supportTypeId = Number(supportTypeId);
    }

    const queryTypes = await QueryType.findAll({
      attributes: ['id', 'queryName'],
      where: whereCondition,
      order: [['queryName', 'ASC']],
    });

    res.json({ success: true, data: queryTypes });
  } catch (error) {
    console.error('Error fetching query types:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
