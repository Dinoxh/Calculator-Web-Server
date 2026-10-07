from fastapi import FastAPI, Request, HTTPException
import Calculator as c
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path


# Start server: uv run fastapi dev server.py --port [port]

#shortcut(set port for server to run on):
#PORT=5000; calc() { curl -s --cookie cookiefile --cookie-jar cookiefile -H 'Content-Type: text/plain' -X POST -d "$2" "http://127.0.0.1:$PORT/$1"; }

# rm cookiefile to clear cookies
#calc endpoint($1) 'example ($2)'


app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="session-key")

default_variables = {"ans": 0.0,
             "PI": c.math.pi,
             "E": c.math.e
             }

@app.get("/vars")
async def vars_endpoint(request: Request):
    #Return this clients saved variables, or the default variables if none yet
    return request.session.get("vars", default_variables)

@app.post("/reset")
async def reset_endpoint(request: Request):
    #Forget this clients variables and go back to the defaults
    request.session.pop("vars", None)
    return default_variables

@app.post("/statement")
async def statement_endpoint(request: Request):
    #Decode the request from client
    line = (await request.body()).decode().strip()

    #takes the variables saved in the cookies, or the default variables if none yet
    variables = dict(request.session.get("vars", default_variables))

    wtok = c.TokenizeWrapper(line)

    #Try to return response
    try:
        result = c.statement(wtok, variables)

        request.session["vars"] = variables

        return result

    #Error handling
    except c.CalculatorSyntaxError as se:
        raise HTTPException(status_code = 400,
                            detail = f"Syntax Error: Error occurred at token '{wtok.get_current()}' just after token '{wtok.get_previous()}'")

    except c.TokenError as te:
        raise HTTPException(status_code = 400,
                            detail = f"*** Syntax error: Unbalanced parentheses")

    except c.EvaluationError as ee:
        raise HTTPException(status_code = 400,
                            detail = f"Evaluation error: {ee}")
    except Exception as e:
        raise HTTPException(status_code=400,
                            detail=f"Error: {e}")

@app.post("/assignment")
async def assignment_endpoint(request: Request):
    #Decode the request from client

    #Copy this clients saved variables from the session, or the default variables if none yet
    variables = dict(request.session.get("vars", default_variables))

    #Try to return response
    try:
        line = (await request.body()).decode().strip()

        wtok = c.TokenizeWrapper(line)

        result = c.assignment(wtok, variables)

        if not wtok.is_at_end():
            raise c.CalculatorSyntaxError("Unexpected token")

        request.session["vars"] = variables

        return result

    #Error handling
    except c.CalculatorSyntaxError as se:
        raise HTTPException(status_code = 400,
                            detail = f"Syntax Error: Error occurred at token '{wtok.get_current()}' just after token '{wtok.get_previous()}'")

    except c.TokenError as te:
        raise HTTPException(status_code = 400,
                            detail = f"*** Syntax error: Unbalanced parentheses")

    except c.EvaluationError as ee:
        raise HTTPException(status_code = 400,
                            detail = f"Evaluation error: {ee}")
    except Exception as e:
        raise HTTPException(status_code=400,
                            detail=f"Error: {e}")

@app.post("/expression")
async def expression_endpoint(request: Request):
    #Decode the request from client
    line = (await request.body()).decode().strip()

    #Copy this clients saved variables from the session, or the default variables if none yet
    variables = dict(request.session.get("vars", default_variables))

    wtok = c.TokenizeWrapper(line)

    #Try to return response
    try:
        result = c.expression(wtok, variables)
        if not wtok.is_at_end():
            raise c.CalculatorSyntaxError("Unexpected token")

        request.session["vars"] = variables

        return result

    #Error handling
    except c.CalculatorSyntaxError as se:
        raise HTTPException(status_code = 400,
                            detail = f"Syntax Error: Error occurred at token '{wtok.get_current()}' just after token '{wtok.get_previous()}'")

    except c.TokenError as te:
        raise HTTPException(status_code = 400,
                            detail = f"*** Syntax error: Unbalanced parentheses")

    except c.EvaluationError as ee:
        raise HTTPException(status_code = 400,
                            detail = f"Evaluation error: {ee}")
    except Exception as e:
        raise HTTPException(status_code=400,
                            detail=f"Error: {e}")

@app.post("/term")
async def term_endpoint(request: Request):
    #Decode the request from client
    line = (await request.body()).decode().strip()

    #Copy this clients saved variables from the session, or the default variables if none yet
    variables = dict(request.session.get("vars", default_variables))

    wtok = c.TokenizeWrapper(line)

    #Try to return response
    try:
        result = c.term(wtok, variables)
        if not wtok.is_at_end():
            raise c.CalculatorSyntaxError("Unexpected token")

        request.session["vars"] = variables

        return result

    #Error handling
    except c.CalculatorSyntaxError as se:
        raise HTTPException(status_code = 400,
                            detail = f"Syntax Error: Error occurred at token '{wtok.get_current()}' just after token '{wtok.get_previous()}'")

    except c.TokenError as te:
        raise HTTPException(status_code = 400,
                            detail = f"*** Syntax error: Unbalanced parentheses")

    except c.EvaluationError as ee:
        raise HTTPException(status_code = 400,
                            detail = f"Evaluation error: {ee}")
    except Exception as e:
        raise HTTPException(status_code=400,
                            detail=f"Error: {e}")

@app.post("/factor")
async def factor_endpoint(request: Request):
    #Decode the request from client
    line = (await request.body()).decode().strip()

    #Copy this clients saved variables from the session, or the default variables if none yet
    variables = dict(request.session.get("vars", default_variables))

    wtok = c.TokenizeWrapper(line)

    #Try to return response
    try:
        result = c.factor(wtok, variables)
        if not wtok.is_at_end():
            raise c.CalculatorSyntaxError("Unexpected token")

        request.session["vars"] = variables

        return result

    #Error handling
    except c.CalculatorSyntaxError as se:
        raise HTTPException(status_code = 400,
                            detail = f"Syntax Error: Error occurred at token '{wtok.get_current()}' just after token '{wtok.get_previous()}'")

    except c.TokenError as te:
        raise HTTPException(status_code = 400,
                            detail = f"*** Syntax error: Unbalanced parentheses")

    except c.EvaluationError as ee:
        raise HTTPException(status_code = 400,
                            detail = f"Evaluation error: {ee}")
    except Exception as e:
        raise HTTPException(status_code=400,
                            detail=f"Error: {e}")


# Serve the frontend. Mounted last so the POST endpoints above take precedence.
app.mount("/", StaticFiles(directory=Path(__file__).parent / "static", html=True), name="static")
