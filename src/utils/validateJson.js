export const validateGameJson = (req, res, next) => {
    const validate = (data) => {
      return typeof data.metadata === 'string' ? 
        JSON.parse(data.metadata) : 
        data.metadata;
    };
  
    try {
      if (req.body.metadata) {
        req.body.metadata = validate(req.body.metadata);
      }
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid metadata format' });
    }
  };