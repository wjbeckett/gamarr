const validateGameJson = (req, res, next) => {
  try {
    if (req.body.metadata && typeof req.body.metadata === 'string') {
      req.body.metadata = JSON.parse(req.body.metadata);
    }
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid metadata format' });
  }
};

module.exports = { validateGameJson };