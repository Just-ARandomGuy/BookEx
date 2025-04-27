# BookEx

![img.png](https://media.cleanshot.cloud/media/81129/PD1Nuq3r6jSrjZcb7qzkhhk4KGKOdKnpIfx5VFjI.jpeg?Expires=1745790636&Signature=Z7teKznNVOlAbvdtZEP1N8FIXuLJ9-puaEQu2TYX9fD5yGGPojBHJlb0ZHzUXA8ro2YzuzI~7K7~cKpldMR43ziqddDHPM6ixWLtnzqO24f-xGsjC3iU4Cs0VYuAc6jCSBIzDJPp1e9evJxqVpxtyLG8GiezNg9eYNthSTF2pt76-oHFESdEWW~LK8eDkVhbNYTVd8mRRURt1jP-LZ0NGJLdQDgqckQVhK2~TQ-aJJJ60LuLedXCuWo8F30afOCVYxhcB0YIcDOxBJ9BuKfWNdBhEOanQXU0E6NKkInRRA5u7qj~WgcjN-EcsmH9kIm-z3ZefFrZ6sHXqyklQd0Fiw__&Key-Pair-Id=K269JMAT9ZF4GZ)

## Getting Started (Local Setup)

Follow these steps to set up the project on your local machine after cloning or pulling the code. These instructions assume you are using PyCharm and
Anaconda/Miniconda.

**Prerequisites:**

* Anaconda or Miniconda installed (which includes Python and Conda)
* Git installed
* PyCharm IDE (Recommended)

**Steps:**

1. **Clone or Pull the Repository:**
    * **If you haven't cloned yet:**
        * **Using PyCharm:** Go to `File` > `New` > `Project from Version Control...` and enter the repository URL. PyCharm will clone it. *Proceed to
          Step 2 before opening the project fully if prompted about interpreters immediately.*
        * **Using Terminal:**
          ```bash
          git clone <your-repository-url>
          cd <your-repo-name>
          ```
          *(Replace `<your-repository-url>` and `<your-repo-name>`)*.
    * **If you have already cloned:**
        * **Using PyCharm:** Open the project folder (`File` > `Open`). Then go to `Git` > `Pull...` (or use the Update Project button).
        * **Using Terminal:** Navigate to the project directory and run `git pull`.

2. **Set Up Anaconda Environment & Install Dependencies:**
    * **Choose or Create Your Conda Environment (Terminal):**
        * Open your Anaconda Prompt or standard terminal where `conda` commands work.
        * Navigate (`cd`) into your cloned project directory (`<your-repo-name>`).
        * **List Existing Environments:** See what environments you already have:
          ```bash
          conda env list
          ```
            * This will show a list of your environments, including the default `base` environment. The active environment is usually marked with an
              asterisk (`*`).
        * **Decide on an Environment:**
            * **(Recommended) Option A: Create a New Environment:** This is best for keeping project dependencies isolated. Choose a name (e.g.,
              `myproject_env`) and Python version:
              ```bash
              conda create --name myproject_env python=3.9 # Or your desired Python 3.x version
              conda activate myproject_env
              ```
            * **Option B: Use an Existing Environment (Non-Base):** If you have another suitable environment listed:
              ```bash
              conda activate <your-existing-env-name>
              ```
            * **(Not Recommended) Option C: Use the `base` Environment:** You *can* use the default `base` environment, but it's generally discouraged
              for specific projects as it can lead to dependency conflicts over time. If you choose this, ensure it's active (it often is by
              default, check `conda env list`):
              ```bash
              conda activate base # Only if it's not already active
              ```
            * **Verify Activation:** Your terminal prompt should now start with the name of your chosen active environment (e.g., `(myproject_env)`,
              `(your-existing-env-name)`, or `(base)`).
    * **Configure Project Interpreter (PyCharm):**
        * Open the project in PyCharm (`File` > `Open` > select `<your-repo-name>` folder).
        * PyCharm might detect the Conda environment or prompt you. If not, go to `File` > `Settings` (or `PyCharm` > `Preferences` on macOS) >
          `Project: <your-repo-name>` > `Python Interpreter`.
        * Click the gear icon > `Add...`.
        * In the left pane, select `Conda Environment`.
        * Choose `Existing environment`. PyCharm should automatically detect Conda environments. **Select the environment you activated in the
          terminal** (e.g., `myproject_env`, `your-existing-env-name`, or `base`) from the `Interpreter:` dropdown list.
        * Ensure the `Conda executable` path is correct.
        * Click `OK`. PyCharm will now use this Conda environment for the project.

3. **Apply Database Migrations:**
    * Make sure your Conda environment is active in PyCharm's Terminal (or your standard terminal), and you are in the project directory containing
      `manage.py`.
    * Run the migrate command:
      ```bash
      python manage.py migrate
      ```
      *(This sets up or updates your local database schema.)*

4. **Create a Local Superuser:**
    * In the same Terminal window (with the Conda environment active), run:
      ```bash
      python manage.py createsuperuser
      ```
    * Follow the prompts to create your admin credentials.

5. **Run the Development Server (PyCharm):**
    * Look for the auto-created "Django server" run configuration in the top-right dropdown menu.
    * Select it and click the green play button (▶️).
    * If it doesn't exist or needs checking:
        * Go to `Run` > `Edit Configurations...`.
        * Click `+` > `Django server`.
        * Name it (e.g., "Run Local Server").
        * **Crucially, ensure the `Python interpreter` is set to your project's chosen Conda environment** (e.g., `myproject_env`, `base`, etc.).
        * Verify Host (`127.0.0.1`), Port (`8000`), and Working Directory.
        * Click `OK`.
        * Select the configuration and click play (▶️).

6. **Ensure Run Configuration is Correct:**
    * Double-check your PyCharm Run Configuration (`Run` > `Edit Configurations...` > select your Django server config):
        * **Python Interpreter:** Must be the **Conda environment** you selected and configured in Step 2.
        * **Working Directory:** Should point to the project root (where `manage.py` is).
        * **Environment Variables:** Add any required variables if needed.

---

After these steps, the development server should run (e.g., `http://127.0.0.1:8000/`). Access the site and log into `/admin/` using the superuser
details from Step 4.