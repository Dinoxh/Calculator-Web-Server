from fastapi import FastAPI, Request, HTTPException
import Calculator as c
from starlette.middleware.sessions import SessionMiddleware


# Start server: uv run fastapi dev server.py --port [port]

#Paste to create shortcut:
#calc() { curl -s -w '  [%{http_code}]\n' --cookie cookiefile --cookie-jar cookiefile -H 'Content-Type: text/plain' -X POST -d "$2" "http://127.0.0.1:4998/$1"; }
# calc [endpoint] ['example']


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

    #Copy this clients saved variables from the session, or the default variables if none yet
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
    line = (await request.body()).decode().strip()

    #Copy this clients saved variables from the session, or the default variables if none yet
    variables = dict(request.session.get("vars", default_variables))

    wtok = c.TokenizeWrapper(line)

    #Try to return response
    try:
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