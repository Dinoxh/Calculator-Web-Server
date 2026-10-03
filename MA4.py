"""
Solutions to module 4 - A calculator
Student: Sami Al Saati
Mail: sami.al-saati.4936@student.uu.se
"""

"""
Note:
The program is only working for a very tiny set of operations.
You have to add and/or modify code in ALL functions as well as add some new functions.
Use the syntax charts when you write the functions!
However, the class CalculatorSyntaxError is complete as well as handling in main
of CalculatorSyntaxError and TokenError.
"""

import math
from tokenize import TokenError  
from MA4tokenizer import TokenizeWrapper


class CalculatorSyntaxError(Exception):
    pass

class EvaluationError(Exception):
    pass

def fac(n):
    if n != int(n) or n < 0:
        raise EvaluationError(f"Argument to fac is {n}. Must be integer >= 0")
    return math.factorial(int(n))


def fib(n):
    if n != int(n) or n < 0:
        raise EvaluationError(f"Argument to fib is {n}. Must be integer >= 0")

    n = int(n)
    a = 0
    b = 1

    for _ in range(n):
        a, b = b, b+a
    return a

def log(n):
    if n <= 0:
        raise EvaluationError(f"Argument to log is {n}: Must be > 0")

    return math.log(n)


def statement(wtok, variables):
    """ See syntax chart for statement"""
    result = assignment(wtok, variables)
    #** should not be recognized, so the current token is still at ** and not at the end
    if not wtok.is_at_end():
        # or expected end of line?
        raise CalculatorSyntaxError("Unexpected token")

    variables['ans'] = result
    return result


def assignment(wtok, variables):
    """ See syntax chart for assignment"""
    result = expression(wtok, variables)
    while wtok.get_current() == '=':
        wtok.next()

        if not wtok.is_name():
            raise CalculatorSyntaxError("Expected variable after '='")

        variables[wtok.get_current()] = result
        wtok.next()
    return result


def expression(wtok, variables):
    """ See syntax chart for expression"""
    result = term(wtok, variables)
    while wtok.get_current() == '+' or wtok.get_current() == '-':
        op = wtok.get_current()
        wtok.next()
        if op == '+':
            result = result + term(wtok, variables)
        elif op == '-':
            result = result - term(wtok, variables)
    return result


def term(wtok, variables):
    """ See syntax chart for term"""
    result = factor(wtok, variables)
    while wtok.get_current() == '*' or wtok.get_current() == '/' or wtok.get_current() == '%':
        op = wtok.get_current()
        wtok.next()
        if op == '*':
            result = result * factor(wtok, variables)
        elif op == '/':
            second_factor = factor(wtok, variables)
            if second_factor == 0:
                raise EvaluationError("Division by zero")
            result = result / second_factor
        elif op == '%':
            second_factor = factor(wtok, variables)
            if second_factor == 0:
                raise EvaluationError("Division by zero")
            result = result % second_factor
    return result


def factor(wtok, variables):
    """ See syntax chart for factor"""
    functions = {'sin': math.sin,
                 'cos': math.cos,
                 'exp': math.exp,
                 'log': log,
                 'fac': fac,
                 'fib': fib
                 }
    if wtok.get_current() == '(':
        wtok.next()
        result = assignment(wtok, variables)
        if wtok.get_current() != ')':
            raise CalculatorSyntaxError("Expected ')'")
        else:
            wtok.next()
            
    elif wtok.is_number():
        result = float(wtok.get_current())
        wtok.next()

    elif wtok.get_current() in functions:
        name = wtok.get_current()

        wtok.next()

        if wtok.get_current() != '(':
            raise CalculatorSyntaxError("Expected '('")

        # next again to get inside the function call, to extract argument
        wtok.next()

        argument = assignment(wtok, variables)

        if wtok.get_current() != ')':
            raise CalculatorSyntaxError("Expected ')'")

        wtok.next()

        result = functions[name](argument)

    elif wtok.is_name():
        name = wtok.get_current()
        if name not in variables:
            raise EvaluationError(f"Undefined variable: {name}")

        result = variables[wtok.get_current()]
        wtok.next()

    elif wtok.get_current() == '-':
        wtok.next()
        result = -factor(wtok, variables)

    else:
        raise CalculatorSyntaxError(
            "Expected number, word or '('")
    return result


         
def main():
    """
    Handles:
       the iteration over input lines,
       commands like 'quit' and 'vars' and
       raised exceptions.
    Starts with reading the init file
    """
    
    print("Numerical calculator")
    variables = {"ans": 0.0,
                 "PI": math.pi,
                 "E": math.e
                 }
    # Note: The unit test file initiate variables in this way. If your implementation 
    # requires another initiation you have to update the test file accordingly.
    init_file = 'MA4init.txt'
    lines_from_file = ''
    try:
        with open(init_file, 'r') as file:
            lines_from_file = file.readlines()
    except FileNotFoundError:
        pass

    while True:
        if lines_from_file:
            line = lines_from_file.pop(0).strip()
            print('init  :', line)
        else:
            line = input('\nInput : ')
        if line == '' or line[0]=='#':
            continue
        wtok = TokenizeWrapper(line)

        if wtok.get_current() == 'quit':
            print('Bye')
            exit()
        elif wtok.get_current() == 'vars':
            for name, item in variables.items():
                print(f"{name} : {item}")
        else:
            try:
                result = statement(wtok, variables)
                print('Result:', result)

            except CalculatorSyntaxError as se:
                print("*** Syntax error: ", se)
                print(
                f"Error occurred at token '{wtok.get_current()}' just after token '{wtok.get_previous()}'")

            except TokenError as te:
                print('*** Syntax error: Unbalanced parentheses')

            except EvaluationError as ee:
                print("*** Evaluation error: ",ee)
 


if __name__ == "__main__":
    main()
