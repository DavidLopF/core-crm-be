import { loadEnvFile } from "node:process";
loadEnvFile();
import cors from "cors";
import morgan from "morgan";
import colors from "colors";
import express, { Application, RequestHandler } from "express";
import { ROUTES, ROUTE_PREFIX } from "./routes";
import { getSingular } from "../shared/utils/functions";
import { success } from "../shared/utils/logger";

class Server {
  private app: Application;
  private port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.middlewares();
    this.app.get("/", (req, res) => {
      res.status(200).json({
        message: "API is running",
      });
    });
  }
  /**
   * Method to start the server
   */
  async listen(): Promise<void> {
    await this.routes();
    this.app.listen(this.port, () => {
      success(`Server running on port ${this.port}`);
    });
  }

  private middlewares(): void {
    this.app.use(cors() as RequestHandler);
    this.app.use(morgan("dev") as RequestHandler);
    this.app.use(express.json() as RequestHandler);
    this.app.use(express.urlencoded({ extended: true }) as RequestHandler);
    this.healthCheck();
  }

  private async healthCheck(): Promise<void> {
      this.app.get("/", (req, res) => {
        res.status(200).json({
          status: "ok",
          uptime: process.uptime(),
          timestamp: new Date(),
        });
      });
  }

  private async routes(): Promise<void> {
    for (const route of ROUTES) {
      try {
        const routeModule = await import(
          `../controllers/${getSingular(route)}.controller`
        );
        console.log(colors.cyan(`Loading route: ${route}`));

        if (process.env.ENVIROMENT == "DEV") {
        }

        this.app.use(`${ROUTE_PREFIX}${route}`, routeModule.default);
      } catch (error) {
        console.log(colors.red(`Error loading route: ${route}`));
        console.error(error);
      }
    }
  }
}

export default Server;
