const { Request, Response } = require('express');
const SupportType = require('../../models/Form/SupportType');

exports.getAllSupportTypes = async (req, res) => {
  try {
    const supportTypes = await SupportType.findAll({
      attributes: ['id', 'supportName'],
      where: { isActive: true }, // Optional: only fetch active support types
      order: [['supportName', 'ASC']], // Optional: alphabetically sorted
    });

    res.json({ success: true, data: supportTypes });
  } catch (error) {
    console.error('Error fetching support types:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
