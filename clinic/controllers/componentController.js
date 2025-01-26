const ComponentService = require('../services/ComponentService');

class ComponentController {
  async createItems(req) {
    const componentService = new ComponentService(req.db);
    const components = Array.isArray(req.body) ? req.body : [req.body];

    const createdComponents = await componentService.createComponents(components);

    // Return the response object instead of using `res`
    return {
      message: `${createdComponents.length} component(s) created successfully`,
      components: createdComponents,
    };
  }

  async updateItems(req) {
    const componentService = new ComponentService(req.db);
    const components = Array.isArray(req.body) ? req.body : [req.body];

    const updatedComponents = await componentService.updateComponents(components);

    // Return the response object instead of using `res`
    return {
      message: `${updatedComponents.length} component(s) updated successfully`,
      components: updatedComponents,
    };
  }

  async deleteItems(req) {
    const componentService = new ComponentService(req.db);
    const componentIds = Array.isArray(req.body) ? req.body : [req.body];

    await componentService.deleteComponents(componentIds);

    // Return the response object instead of using `res`
    return {
      message: `${componentIds.length} component(s) deleted successfully`,
    };
  }

  // If you still need `getAllComponents`, keep it as is because it requires `res` for pagination:
  async getAllComponents(req, res) {
    try {
      const { name = '', offset = 0 } = req.query;
      const limit = 20;

      const componentService = new ComponentService(req.db);
      const components = await componentService.getAllComponents({ name, offset, limit });

      res.status(200).json({
        components,
        limit,
        offset: parseInt(offset, 10) + limit,
      });
    } catch (error) {
      console.error('Error fetching components:', error);
      res.status(500).json({ message: 'Error fetching components', error: error.message });
    }
  }
}

module.exports = ComponentController;