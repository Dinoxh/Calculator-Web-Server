from fastapi import FastAPI, Request, HTTPException
import Calculator as c
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key="session-key")

default_variables = {"ans": 0.0,
             "PI": c.math.pi,
             "E": c.math.e
             }

@app.post("/statement")
async def statement_endpoint(request: Request):
    #Decode the request from client
    line = (await request.body()).decode().strip()

    #copy this clients saved variables from the session, or the default variables if none yet
    variables = dict(request.session.get("vars", default_variables))

    wtok = c.TokenizeWrapper(line)

    #Try to return response
    try:
        result = c.statement(wtok, variables)

        request.session["vars"] = variables

        return result

    except c.CalculatorSyntaxError as se:
        raise HTTPException(status_code = 400,
                            detail = f"Syntax Error: Error occurred at token '{wtok.get_current()}' just after token '{wtok.get_previous()}'")

    except c.TokenError as te:
        raise HTTPException(status_code = 400,
                            detail = f"*** Syntax error: Unbalanced parentheses")

    except c.EvaluationError as ee:
        raise HTTPException(status_code = 400,
                            detail = f"Evaluation error: {ee}")
