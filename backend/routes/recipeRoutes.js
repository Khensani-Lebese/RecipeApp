const express = require('express');
const Recipe = require('../models/Recipe');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// GET all recipes with optional filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 5, name, category } = req.query;

    // Build query based on filters
    const filter = {};
    if (name) filter.name = new RegExp(name, 'i'); // Case-insensitive name search
    if (category) filter.category = category;

    // Get recipes with pagination
    const recipes = await Recipe.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Recipe.countDocuments(filter);

    res.json({ recipes, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recipes', error: error.message });
  }
});

// Create a new recipe
router.post('/', async (req, res) => {
  try {
    const recipe = new Recipe(req.body);
    await recipe.save();
    res.status(201).json(recipe);
  } catch (error) {
    res.status(400).json({ message: 'Error creating recipe', error: error.message });
  }
});

// Update a recipe
router.put('/:id', authenticate, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    res.status(400).json({ message: 'Error updating recipe', error: error.message });
  }
});

// Delete a recipe
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting recipe', error: error.message });
  }
});

module.exports = router;
